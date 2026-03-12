// app/api/agent/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuditHelpers } from '@/app/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
    try {
        if (!JWT_SECRET) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { email, password, locationId } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find agent by email
        const agent = db.prepare(`
            SELECT * FROM agents 
            WHERE contact_email = ? AND status = 'active'
        `).get(email) as any;

        if (!agent) {
            await AuditHelpers.loginFailed(email, 'agent_not_found', 
                request.headers.get('x-forwarded-for'),
                request.headers.get('user-agent')
            );
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, agent.password);
        if (!isValid) {
            await AuditHelpers.loginFailed(email, 'invalid_password',
                request.headers.get('x-forwarded-for'),
                request.headers.get('user-agent')
            );
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if agent is verified
        if (!agent.verified) {
            return NextResponse.json({
                error: 'Account pending verification',
                requiresVerification: true
            }, { status: 403 });
        }

        // Create session
        const sessionResult = db.prepare(`
            INSERT INTO agent_sessions (agent_id, location_id, ip_address, user_agent)
            VALUES (?, ?, ?, ?)
        `).run(
            agent.id,
            locationId || null,
            request.headers.get('x-forwarded-for'),
            request.headers.get('user-agent')
        );

        // Update last login
        db.prepare(`
            UPDATE agents SET last_login = CURRENT_TIMESTAMP WHERE id = ?
        `).run(agent.id);

        // Generate JWT
        const token = jwt.sign(
            {
                id: agent.id,
                email: agent.contact_email,
                name: agent.contact_name,
                business: agent.business_name,
                type: 'agent',
                verified: agent.verified,
                sessionId: sessionResult.lastInsertRowid
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Get agent's locations
        const locations = db.prepare(`
            SELECT id, location_name, address, city, is_main
            FROM agent_locations
            WHERE agent_id = ? AND status = 'active'
        `).all(agent.id);

        // Log successful login
        await AuditHelpers.loginSuccess(
            {
                id: agent.id,
                user_type: 'agent',
                email: agent.contact_email,
                name: agent.contact_name
            },
            request.headers.get('x-forwarded-for'),
            request.headers.get('user-agent')
        );

        // Remove sensitive data
        delete agent.password;

        return NextResponse.json({
            success: true,
            token,
            agent: {
                id: agent.id,
                business_name: agent.business_name,
                business_type: agent.business_type,
                contact_name: agent.contact_name,
                contact_email: agent.contact_email,
                contact_phone: agent.contact_phone,
                commission_rate: agent.commission_rate,
                can_sell_all_companies: agent.can_sell_all_companies,
                restricted_companies: agent.restricted_companies ? 
                    JSON.parse(agent.restricted_companies) : []
            },
            locations,
            sessionId: sessionResult.lastInsertRowid
        });

    } catch (error) {
        console.error('Agent login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}