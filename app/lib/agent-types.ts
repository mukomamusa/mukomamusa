// app/lib/agent-types.ts

export type AgentBusinessType = 
    | 'retail_chain'      // Shoprite, Pick n Pay
    | 'station_kiosk'     // Bus station booth
    | 'travel_agency'     // Travel agency
    | 'independent';      // Individual agent

export type AgentStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface Agent {
    id: number;
    business_name: string;
    business_type: AgentBusinessType;
    registration_number?: string;
    tax_id?: string;
    
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    alternative_phone?: string;
    
    physical_address: string;
    city: string;
    province: string;
    
    commission_rate: number;
    commission_type: 'percentage' | 'fixed';
    fixed_commission_amount: number;
    
    verified: boolean;
    verified_at?: string;
    verified_by?: number;
    
    status: AgentStatus;
    
    can_sell_all_companies: boolean;
    restricted_companies?: number[]; // Array of company IDs
    
    business_certificate_url?: string;
    tax_clearance_url?: string;
    id_document_url?: string;
    
    created_at: string;
    updated_at: string;
    last_login?: string;
}

export interface AgentLocation {
    id: number;
    agent_id: number;
    location_name: string;
    address: string;
    city: string;
    phone?: string;
    is_main: boolean;
    latitude?: number;
    longitude?: number;
    status: 'active' | 'inactive';
}

export interface AgentCommission {
    id: number;
    agent_id: number;
    booking_id: number;
    booking_reference: string;
    amount: number;
    commission_rate: number;
    commission_amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    paid_at?: string;
    notes?: string;
    created_at: string;
}

// Commission calculation helper
export function calculateAgentCommission(
    agent: Agent,
    bookingAmount: number
): { rate: number; amount: number } {
    if (agent.commission_type === 'percentage') {
        const rate = agent.commission_rate / 100;
        return {
            rate: agent.commission_rate,
            amount: Math.round(bookingAmount * rate * 100) / 100
        };
    } else {
        return {
            rate: 0,
            amount: agent.fixed_commission_amount
        };
    }
}

// Agent permissions helper
export function canAgentSellForCompany(
    agent: Agent,
    companyId: number
): boolean {
    if (agent.can_sell_all_companies) return true;
    if (!agent.restricted_companies) return false;
    return agent.restricted_companies.includes(companyId);
}