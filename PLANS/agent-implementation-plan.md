# Agent Implementation Plan

## Overview
Agents are ticket sellers who sell tickets from different bus operators for commission. They can work independently or with travel agencies, and sell tickets for one or multiple bus companies.

## Current State
- ✅ Agent login API (`/api/agent/login`) - exists and works
- ✅ Agent bookings API (`/api/agent/bookings`) - exists but needs verifyAgentToken
- ✅ Agent types library (`app/lib/agent-types.ts`) - commission calculations exist
- ✅ Audit logging - supports agent actions
- ❌ Agent authentication helper - MISSING
- ❌ Agent login page - MISSING
- ❌ Agent dashboard - MISSING
- ❌ Homepage button - MISSING

## Implementation Todo List

### 1. Create Agent Authentication Helper
- File: `app/lib/agent-auth.ts`
- Function: `verifyAgentToken(token: string)` - validates JWT and returns agent data

### 2. Create Agent Registration API
- Endpoint: `POST /api/agent/register`
- Allows new agents to apply/register
- Fields: business name, business type, contact info, password
- Status: pending (requires admin approval)

### 3. Create Agent Login Page
- Path: `/agent/login`
- Features:
  - Login form (email + password)
  - Registration link
  - Use consistent colors from globals.css

### 4. Create Agent Dashboard
- Path: `/agent/dashboard`
- Features:
  - Search routes from assigned companies
  - Book tickets for customers
  - View sales history
  - View commission earnings
  - Select selling location

### 5. Add Agent Login Button to Homepage
- Add "Agent Login" button to `/` page
- Place with other login buttons (Customer, Driver, Company)

### 6. Create Admin Agent Management API
- Endpoint: `GET /api/admin/agents` - list all agents
- Endpoint: `PATCH /api/admin/agents/[id]` - approve/reject/suspend
- Endpoint: `POST /api/admin/agents` - create agent directly

### 7. Create Admin Agent Management UI
- Add "Agents" tab to admin dashboard
- View pending agents
- Approve/reject agents
- Set commission rates

## Color Scheme (from globals.css)
- Primary Green: #198A00
- Secondary Orange: #EF7D00
- Accent Red: #DE2010

## Database Tables (assumed existing)
- `agents` - agent profiles
- `agent_sessions` - login sessions
- `agent_locations` - selling locations
- `agent_commission_logs` - commission tracking
