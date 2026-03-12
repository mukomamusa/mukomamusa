// app/lib/audit.ts
import db from '@/app/lib/database-schema';

export type ActorType = 'user' | 'driver' | 'agent' | 'system' | 'unknown';

export type ActionCategory = 
    | 'auth'        // Authentication events
    | 'profile'     // Profile updates
    | 'booking'     // Booking operations
    | 'payment'     // Payment operations
    | 'route'       // Route management
    | 'bus'         // Bus management
    | 'driver'      // Driver management
    | 'review'      // Review operations
    | 'admin'       // Admin actions
    | 'system'      // System events
    | 'agent';      // Agent actions

export type AuditAction = 
    // Auth actions
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'password_change'
    | 'password_reset_request'
    | 'password_reset'
    | 'email_verified'
    | 'two_factor_enabled'
    | 'two_factor_disabled'
    
    // Profile actions
    | 'profile_updated'
    | 'avatar_updated'
    | 'company_details_updated'
    | 'driver_details_updated'
    
    // Booking actions
    | 'booking_created'
    | 'booking_cancelled'
    | 'booking_modified'
    | 'booking_completed'
    | 'booking_viewed'
    | 'ticket_downloaded'
    
    // Payment actions
    | 'payment_initiated'
    | 'payment_completed'
    | 'payment_failed'
    | 'payment_refunded'
    | 'payment_method_added'
    | 'payment_method_removed'
    
    // Route actions
    | 'route_created'
    | 'route_updated'
    | 'route_cancelled'
    | 'route_delayed'
    | 'route_completed'
    | 'route_assigned'
    | 'route_bulk_created'
    
    // Bus actions
    | 'bus_added'
    | 'bus_updated'
    | 'bus_deleted'
    | 'bus_maintenance'
    | 'bus_subscription_renewed'
    
    // Driver actions
    | 'driver_added'
    | 'driver_updated'
    | 'driver_deleted'
    | 'driver_status_changed'
    | 'driver_assigned'
    
    // Review actions
    | 'review_submitted'
    | 'review_approved'
    | 'review_rejected'
    | 'review_responded'
    
    // Admin actions
    | 'user_suspended'
    | 'user_activated'
    | 'user_verified'
    | 'settings_updated'
    | 'commission_updated'
    
    // Agent actions
    | 'agent_registered'
    | 'agent_approved'
    | 'agent_rejected'
    | 'agent_suspended'
    | 'agent_commission_updated'
    
    // System actions
    | 'system_error'
    | 'database_backup'
    | 'cron_executed';

export interface Actor {
    id: number;
    type: ActorType;
    email: string;
    name: string;
}

export interface AuditLogData {
    // Who performed the action (polymorphic)
    actor: Actor;
    
    // What action was performed
    action: AuditAction;
    category: ActionCategory;
    
    // Affected entity (optional)
    entityType?: string;
    entityId?: number;
    
    // Changes (optional)
    oldValue?: any;
    newValue?: any;
    
    // Context
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    
    // Result
    status?: 'success' | 'failure' | 'pending';
    errorMessage?: string;
}

/**
 * Core audit logging function
 * Logs an action with polymorphic actor reference
 */

export async function logAudit(data: AuditLogData): Promise<void> {
    try {
        const {
            actor,
            action, category,
            entityType, entityId,
            oldValue, newValue,
            ipAddress, userAgent, metadata,
            status = 'success',
            errorMessage
        } = data;

        // Count the number of columns in your INSERT statement
        const query = `
            INSERT INTO audit_logs (
                actor_id, actor_type, actor_email, actor_name,
                user_id, driver_id, agent_id,
                action, action_category,
                entity_type, entity_id,
                old_value, new_value,
                ip_address, user_agent, metadata,
                status, error_message,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Count the params - should match the number of ? placeholders (19)
        // Handle unknown/anonymous actors (like failed login for non-existent user)
        const isUnknownActor = actor.type === 'unknown' || actor.id === 0;
        const params: any[] = [
            actor.id,                                   // 1
            actor.type === 'unknown' ? 'system' : actor.type,  // 2 - map unknown to system
            actor.email,                                // 3
            actor.name,                                 // 4
            (actor.type === 'user' && !isUnknownActor) ? actor.id : null,   // 5 - user_id
            actor.type === 'driver' ? actor.id : null, // 6 - driver_id
            actor.type === 'agent' ? actor.id : null,  // 7 - agent_id
            action,                                     // 8
            category,                                   // 9
            entityType || null,                         // 10
            entityId || null,                           // 11
            oldValue ? JSON.stringify(oldValue) : null, // 12
            newValue ? JSON.stringify(newValue) : null, // 13
            ipAddress || null,                          // 14
            userAgent || null,                          // 15
            metadata ? JSON.stringify(metadata) : null, // 16
            status,                                     // 17
            errorMessage || null,                       // 18
            new Date().toISOString()                    // 19 - created_at
        ];

        console.log('📝 Inserting audit log with params count:', params.length);
        
        db.prepare(query).run(...params);

        console.log(`📝 Audit: ${actor.type}:${actor.id} - ${action} (${status})`);
    } catch (error) {
        console.error('Error logging audit:', error);
        // Don't throw - audit should not break main operation
    }
}

/**
 * Helper functions for common audit scenarios
 */
export const AuditHelpers = {
    // ========================================================================
    // User (customer, company, admin) helpers
    // ========================================================================
    
    /**
     * Log an action performed by a user (from users table)
     */
    // In your AuditHelpers.userAction method
async userAction(
    user: any,
    action: AuditAction,
    category: ActionCategory,
    data?: Partial<AuditLogData>
): Promise<void> {
    await logAudit({
        actor: {
            id: user.id,
            type: 'user',
            email: user.email,
            name: user.name
        },
        action,
        category,
        ...data
    });
},

    // ========================================================================
    // Driver helpers
    // ========================================================================
    
    /**
     * Log an action performed by a driver (from drivers table)
     */
    async driverAction(
        driver: any,
        action: AuditAction,
        category: ActionCategory,
        data?: Partial<AuditLogData>
    ): Promise<void> {
        await logAudit({
            actor: {
                id: driver.id,
                type: 'driver',
                email: driver.email,
                name: driver.name
            },
            action,
            category,
            ...data
        });
    },

    // ========================================================================
    // Agent helpers
    // ========================================================================
    
    /**
     * Log an action performed by an agent (from agents table)
     */
    async agentAction(
        agent: any,
        action: AuditAction,
        category: ActionCategory,
        data?: Partial<AuditLogData>
    ): Promise<void> {
        await logAudit({
            actor: {
                id: agent.id,
                type: 'agent',
                email: agent.contact_email,
                name: agent.contact_name
            },
            action,
            category,
            ...data
        });
    },

    // ========================================================================
    // Authentication helpers
    // ========================================================================
    
    /**
     * Log a successful login for any actor type
     */
    async loginSuccess(
        actor: Actor,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor,
            action: 'login_success',
            category: 'auth',
            ipAddress: ip,
            userAgent: ua,
            metadata: { method: 'password' }
        });
    },

    /**
     * Log a failed login attempt
     * Tries to find the user in any of the actor tables
     */
    async loginFailed(
        identifier: string, // email or phone
        reason: string,
        ip?: string,
        ua?: string
    ): Promise<void> {
        try {
            // Try to find in users table
            const user = db.prepare(`
                SELECT id, user_type, name, email 
                FROM users 
                WHERE email = ? OR phone = ?
            `).get(identifier, identifier) as any;

            if (user) {
                await logAudit({
                    actor: {
                        id: user.id,
                        type: 'user',
                        email: user.email,
                        name: user.name
                    },
                    action: 'login_failed',
                    category: 'auth',
                    ipAddress: ip,
                    userAgent: ua,
                    status: 'failure',
                    errorMessage: reason,
                    metadata: { identifier }
                });
                return;
            }

            // Try to find in drivers table
            const driver = db.prepare(`
                SELECT id, name, email 
                FROM drivers 
                WHERE email = ? OR phone = ?
            `).get(identifier, identifier) as any;

            if (driver) {
                await logAudit({
                    actor: {
                        id: driver.id,
                        type: 'driver',
                        email: driver.email,
                        name: driver.name
                    },
                    action: 'login_failed',
                    category: 'auth',
                    ipAddress: ip,
                    userAgent: ua,
                    status: 'failure',
                    errorMessage: reason,
                    metadata: { identifier }
                });
                return;
            }

            // Try to find in agents table
            const agent = db.prepare(`
                SELECT id, contact_name as name, contact_email as email 
                FROM agents 
                WHERE contact_email = ? OR contact_phone = ?
            `).get(identifier, identifier) as any;

            if (agent) {
                await logAudit({
                    actor: {
                        id: agent.id,
                        type: 'agent',
                        email: agent.email,
                        name: agent.name
                    },
                    action: 'login_failed',
                    category: 'auth',
                    ipAddress: ip,
                    userAgent: ua,
                    status: 'failure',
                    errorMessage: reason,
                    metadata: { identifier }
                });
                return;
            }

            // Unknown user - create a temporary actor for logging (without foreign key references)
            // Use 'unknown' type which maps to 'system' in DB and sets all FK IDs to null
            await logAudit({
                actor: {
                    id: 0,
                    type: 'unknown',
                    email: identifier,
                    name: 'Unknown'
                },
                action: 'login_failed',
                category: 'auth',
                ipAddress: ip,
                userAgent: ua,
                status: 'failure',
                errorMessage: reason,
                metadata: { identifier, unknown: true }
            });
        } catch (error) {
            console.error('Error logging failed login:', error);
        }
    },

    /**
     * Log a logout action
     */
    async logout(
        actor: Actor,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor,
            action: 'logout',
            category: 'auth',
            ipAddress: ip,
            userAgent: ua
        });
    },

    // ========================================================================
    // Business operation helpers
    // ========================================================================
    
    /**
     * Log a booking creation
     */
    async bookingCreated(
        actor: Actor,
        booking: any,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor,
            action: 'booking_created',
            category: 'booking',
            entityType: 'booking',
            entityId: booking.id,
            newValue: {
                reference: booking.booking_reference,
                route: `${booking.origin || '?'} → ${booking.destination || '?'}`,
                amount: booking.total_price,
                seats: booking.num_seats
            },
            ipAddress: ip,
            userAgent: ua
        });
    },

    /**
     * Log a payment completion
     */
    async paymentCompleted(
        actor: Actor,
        payment: any,
        bookingRef: string,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor,
            action: 'payment_completed',
            category: 'payment',
            entityType: 'payment',
            entityId: payment.id,
            newValue: {
                amount: payment.amount,
                method: payment.payment_method,
                booking: bookingRef,
                transaction_id: payment.transaction_id
            },
            ipAddress: ip,
            userAgent: ua
        });
    },

    /**
     * Log a user status change (admin action)
     */
    async userStatusChanged(
        admin: Actor,
        targetUser: any,
        oldStatus: string,
        newStatus: string,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor: admin,
            action: newStatus === 'suspended' ? 'user_suspended' : 'user_activated',
            category: 'admin',
            entityType: 'user',
            entityId: targetUser.id,
            oldValue: { status: oldStatus },
            newValue: { status: newStatus },
            metadata: {
                target_email: targetUser.email,
                target_type: targetUser.user_type
            },
            ipAddress: ip,
            userAgent: ua
        });
    },

    /**
     * Log a driver assignment to a route
     */
    async driverAssigned(
        company: Actor,
        driver: any,
        route: any,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor: company,
            action: 'driver_assigned',
            category: 'driver',
            entityType: 'route',
            entityId: route.id,
            newValue: {
                driver_id: driver.id,
                driver_name: driver.name,
                route: `${route.origin} → ${route.destination}`,
                date: route.date
            },
            ipAddress: ip,
            userAgent: ua
        });
    },

    /**
     * Log an agent approval (admin action)
     */
    async agentApproved(
        admin: Actor,
        agent: any,
        ip?: string,
        ua?: string
    ): Promise<void> {
        await logAudit({
            actor: admin,
            action: 'agent_approved',
            category: 'agent',
            entityType: 'agent',
            entityId: agent.id,
            newValue: {
                business_name: agent.business_name,
                contact_name: agent.contact_name,
                contact_email: agent.contact_email
            },
            ipAddress: ip,
            userAgent: ua
        });
    },

    /**
     * Log a system error
     */
    async systemError(
        error: Error,
        context?: Record<string, any>
    ): Promise<void> {
        await logAudit({
            actor: {
                id: 0,
                type: 'user',
                email: 'system',
                name: 'System'
            },
            action: 'system_error',
            category: 'system',
            status: 'failure',
            errorMessage: error.message,
            metadata: {
                stack: error.stack,
                ...context
            }
        });
    },

    // ========================================================================
    // Query helpers
    // ========================================================================
    
    /**
     * Get audit logs for a specific actor
     */
    async getActorLogs(
        actor: Actor,
        limit: number = 50,
        offset: number = 0
    ): Promise<any[]> {
        try {
            let query = '';
            let params: any[] = [];

            if (actor.type === 'user') {
                query = `SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                params = [actor.id, limit, offset];
            } else if (actor.type === 'driver') {
                query = `SELECT * FROM audit_logs WHERE driver_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                params = [actor.id, limit, offset];
            } else if (actor.type === 'agent') {
                query = `SELECT * FROM audit_logs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                params = [actor.id, limit, offset];
            }

            return db.prepare(query).all(...params) || [];
        } catch (error) {
            console.error('Error fetching actor logs:', error);
            return [];
        }
    },

    /**
     * Get recent audit logs across all actors
     */
    async getRecentLogs(
        limit: number = 100,
        offset: number = 0
    ): Promise<any[]> {
        try {
            return db.prepare(`
                SELECT * FROM audit_logs 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `).all(limit, offset);
        } catch (error) {
            console.error('Error fetching recent logs:', error);
            return [];
        }
    },

    /**
     * Get audit logs by action category
     */
    async getLogsByCategory(
        category: ActionCategory,
        limit: number = 50
    ): Promise<any[]> {
        try {
            return db.prepare(`
                SELECT * FROM audit_logs 
                WHERE action_category = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `).all(category, limit);
        } catch (error) {
            console.error('Error fetching logs by category:', error);
            return [];
        }
    },

    /**
     * Get audit logs for a specific entity
     */
    async getEntityLogs(
        entityType: string,
        entityId: number,
        limit: number = 50
    ): Promise<any[]> {
        try {
            return db.prepare(`
                SELECT * FROM audit_logs 
                WHERE entity_type = ? AND entity_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `).all(entityType, entityId, limit);
        } catch (error) {
            console.error('Error fetching entity logs:', error);
            return [];
        }
    }
};

// Default export for convenience
export default AuditHelpers;