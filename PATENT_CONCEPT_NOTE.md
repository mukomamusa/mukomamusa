# INVENTION DISCLOSURE DOCUMENT

## CONCEPT NOTE FOR PATENT APPLICATION

---

**Document Date:** March 14, 2026  
**Inventor(s):** [To be filled with actual inventor names]  
**Assigned Entity:** Vayazed / [Company Name]  
**Document Status:** Confidential - For Patent Attorney Review

---

## 1. NAME OF INVENTION

**VAYAZED** - An Integrated Multi-Stakeholder Intercity Bus Booking System with Real-Time Tracking, Agent Commission Management, and Progressive Web Application Capabilities

**Alternative Titles:**
- Vayazed Transportation Management System
- Multi-Role Intercity Bus Booking Platform with Real-Time Coordination
- Unified Bus Transportation Ecosystem with Agent Network Integration

---

## 2. INVENTION SUMMARY

Vayazed is a comprehensive, multi-stakeholder intercity bus booking and management system designed specifically for emerging markets, particularly in Sub-Saharan Africa. The invention addresses critical gaps in the transportation technology ecosystem by integrating multiple user roles (customers, bus companies, drivers, travel agents, and administrators) into a single unified platform with advanced features including real-time GPS tracking, progressive web application (PWA) capabilities for offline functionality, integrated mobile money payments, and a novel agent booking system with automated commission tracking.

### Problem Solved

The invention solves the following interconnected problems in intercity transportation:

1. **Fragmented Booking Ecosystem**: Current solutions require separate systems for customers, operators, and agents, leading to data silos and inefficiencies.

2. **Lack of Real-Time Visibility**: Passengers and operators lack live tracking capabilities, causing uncertainty and poor customer experience.

3. **Agent Network Disorganization**: Informal travel agent networks lack digital tools for booking management, commission tracking, and customer relationship management.

4. **Payment Exclusion**: Traditional systems exclude unbanked populations who rely on mobile money services prevalent in Africa.

5. **Connectivity Limitations**: Existing applications fail in areas with poor internet connectivity, common in intercity travel routes.

6. **Multi-Operator Comparison Difficulty**: Passengers cannot easily compare prices, amenities, and ratings across different bus companies on a single platform.

### Core Innovation

Vayazed introduces a unified platform architecture that simultaneously serves five distinct user roles with role-specific interfaces while maintaining data consistency and real-time synchronization across all stakeholders. The system's novel approach to agent commission management, combined with offline-first PWA architecture and integrated mobile money payments, creates a comprehensive solution not currently available in the market.

---

## 3. BACKGROUND

### Current State of Technology

The intercity bus transportation sector in Sub-Saharan Africa faces significant technological challenges that current solutions fail to adequately address. A review of existing systems reveals the following limitations:

#### 3.1 Existing Bus Booking Systems

**Traditional Online Booking Platforms** (e.g., redBus, Busbud, Bookaway)
- Primarily designed for developed markets with stable internet infrastructure
- Focus on customer booking only, neglecting other stakeholders
- Lack offline functionality essential for African intercity routes
- Limited or no integration with mobile money payment systems
- No support for agent networks that are prevalent in African markets

**Operator-Specific Systems**
- Individual bus companies maintain proprietary booking systems
- No interoperability between different operators
- Customers must visit multiple platforms to compare options
- Lack standardized data formats for route and schedule information
- No unified tracking or customer feedback mechanism

**Mobile SMS-Based Booking**
- Common in African markets due to low smartphone penetration
- Limited functionality (booking only, no tracking or agent features)
- No visual seat selection or real-time availability
- No integration with modern web technologies

#### 3.2 Real-Time Tracking Systems

**GPS Fleet Management Systems** (e.g., Ctrack, Tramigo)
- Designed for fleet operators, not passengers
- Require dedicated hardware installation
- No integration with booking systems
- Complex interfaces not suitable for end consumers
- High cost of entry for small operators

**Consumer Tracking Applications**
- Limited to specific operators or routes
- No integration with booking workflow
- Lack multi-provider aggregation
- No ETA prediction algorithms
- Poor performance in low-connectivity areas

#### 3.3 Agent and Commission Management

**Traditional Travel Agent Systems**
- Designed for airline and hotel bookings, not bus transportation
- Complex commission structures not suited for informal agent networks
- High fees and requirements exclude small-scale agents
- No mobile-optimized interfaces
- Lack customer relationship management features

**Informal Agent Networks**
- Operate without digital tools
- Manual commission calculations prone to errors
- No booking history or customer tracking
- Cash-only transactions with security risks
- No integration with bus operator systems

#### 3.4 Payment Systems

**Credit/Debit Card Systems**
- Low adoption rates in target markets
- Exclude unbanked populations
- High transaction fees
- Limited acceptance by small operators

**Mobile Money Services** (M-Pesa, Airtel Money, MTN Mobile Money)
- Individual service APIs, no unified integration
- Developers must integrate each service separately
- No standardized payment flow across operators
- Lack webhook integration for booking confirmation

#### 3.5 Progressive Web Applications in Transportation

**Current PWA Implementations**
- Focus on content delivery, not transactional applications
- Limited offline booking capabilities
- No complex data synchronization mechanisms
- Lack support for multi-role applications

### Limitations of Current Solutions

1. **Fragmentation**: No single platform addresses all stakeholder needs simultaneously
2. **Connectivity Dependency**: Systems fail without constant internet access
3. **Payment Exclusion**: Traditional payment methods exclude large segments of the population
4. **Agent Neglect**: Informal agent networks remain underserved by digital platforms
5. **Tracking Gaps**: No integrated solution combines booking with real-time tracking
6. **Data Silos**: Information is not shared between operators, agents, and customers
7. **Poor User Experience**: Existing systems lack modern, intuitive interfaces
8. **Scalability Issues**: Solutions designed for single operators cannot scale to multiple providers

---

## 4. DETAILED DESCRIPTION

Vayazed comprises an integrated system architecture with the following major components:

### 4.1 System Architecture Overview

The invention implements a full-stack web application architecture using modern technologies optimized for performance, scalability, and offline functionality.

#### Technology Stack
- **Frontend Framework**: Next.js 16 (React 19) with TypeScript for type safety
- **Backend Runtime**: Node.js with API routes for server-side logic
- **Database**: SQLite (development) / PostgreSQL (production) for data persistence
- **Offline Storage**: IndexedDB for client-side data caching
- **Real-Time Communication**: WebSocket (Socket.IO) for live updates
- **Service Worker**: PWA implementation for offline capabilities

### 4.2 Multi-Role Dashboard System

The system implements five distinct dashboard interfaces, each optimized for specific user roles:

#### 4.2.1 Customer Dashboard
- **Search and Discovery**: Multi-criteria search (origin, destination, date, time)
- **Operator Comparison**: Side-by-side comparison of prices, amenities, ratings, and reviews
- **Interactive Seat Selection**: Visual seat map with real-time availability
- **Booking Management**: View history, download tickets, cancel bookings
- **Real-Time Tracking**: Live GPS tracking with ETA prediction
- **Review System**: Post-trip ratings and reviews for operators and routes
- **Loyalty Program**: Points accumulation and rewards tracking

#### 4.2.2 Bus Company Dashboard
- **Fleet Management**: Add, edit, deactivate buses with detailed specifications
- **Route Configuration**: Define routes, stops, pricing, and schedules
- **Dynamic Pricing**: Route-level pricing multipliers for demand management
- **Booking Analytics**: Revenue tracking, occupancy rates, popular routes
- **Driver Assignment**: Assign drivers to buses and routes
- **Manifest Management**: View passenger lists and boarding details
- **GPS Integration**: Register and manage tracking devices
- **Performance Metrics**: Route profitability, customer satisfaction scores

#### 4.2.3 Driver Dashboard
- **Trip Management**: View assigned trips, start/end trip functionality
- **Passenger Manifest**: Digital access to booking details
- **Location Sharing**: GPS-based position transmission
- **Trip Status Updates**: Real-time status communication to passengers
- **Earnings Tracking**: Daily and trip-level earnings display
- **Navigation Integration**: Route guidance and stop notifications

#### 4.2.4 Agent Dashboard (Novel Component)
- **Customer Management**: Register and manage customer profiles
- **Single Booking**: Quick booking for walk-in customers
- **Bulk Booking**: Multi-passenger booking for groups
- **Commission Tracking**: Real-time commission calculations
- **Earnings Dashboard**: Historical and projected commission display
- **Booking History**: Complete record of all facilitated transactions
- **Customer Communication**: In-app messaging and notifications
- **Commission Tier Management**: Automatic tier upgrades based on volume

#### 4.2.5 Administrator Dashboard
- **System Analytics**: Platform-wide statistics and trends
- **User Management**: Approve, suspend, manage all user types
- **Company Verification**: Vetting and approval of bus operators
- **Agent Approval**: Review and approve agent applications
- **Revenue Tracking**: Platform fee collection and reporting
- **Dispute Resolution**: Handle customer complaints and refund requests
- **System Health**: Monitor API performance, database health, server load
- **Audit Logs**: Comprehensive activity tracking for compliance

### 4.3 Novel Agent Booking and Commission System

This component represents a key innovation of Vayazed, addressing the underserved market of informal travel agents.

#### Agent Registration and Verification
- Online application with identity verification
- Document upload (ID, business registration)
- Admin review and approval workflow
- Automatic commission tier assignment based on projected volume

#### Commission Structure
- **Configurable Rates**: Admin-defined commission percentages
- **Tiered System**: 
  - Bronze: Base commission rate (e.g., 3%)
  - Silver: Elevated rate (e.g., 5%) after 50 bookings
  - Gold: Premium rate (e.g., 7%) after 200 bookings
  - Platinum: Maximum rate (e.g., 10%) after 500 bookings
- **Route-Specific Commissions**: Higher rates for premium routes
- **Operator Bonuses**: Additional commissions from partner operators

#### Commission Calculation Algorithm
```
Commission = (Base Ticket Price × Commission Rate) + Route Bonus + Operator Bonus
```

#### Commission Payout System
- Automatic accrual upon trip completion
- Minimum threshold for withdrawal
- Multiple payout options (mobile money, bank transfer)
- Transaction history and tax documentation

#### Bulk Booking Workflow
1. Agent selects route and date
2. Chooses operator and bus
3. Selects multiple seats (up to capacity)
4. Enters passenger details (or selects from saved customers)
5. Reviews commission calculation
6. Processes payment (customer pays agent)
7. Agent pays platform (minus commission)
8. Tickets generated and sent to passengers

### 4.4 Real-Time GPS Tracking System

The tracking system integrates multiple GPS providers to provide comprehensive coverage across different operators and regions.

#### GPS Provider Integration
- **Ctrack Integration**: API-based location fetching
- **Tramigo Integration**: Alternative tracking provider
- **Teltonika Integration**: Hardware device support
- **Fallback Mechanism**: Driver app-based location sharing when no GPS device

#### Tracking Data Flow
1. GPS device transmits location every 30 seconds
2. Data received via provider webhook/API
3. Location stored in database with timestamp
4. WebSocket push to subscribed clients
5. Frontend updates map in real-time
6. ETA calculated based on distance and average speed

#### ETA Prediction Algorithm
```
ETA = (Remaining Distance / Average Speed) × Traffic Factor
```
Where Traffic Factor is determined by historical data for the route and time of day.

#### Passenger Tracking Features
- Live map view with bus position
- Route visualization with stops
- Progress percentage indicator
- Estimated arrival time
- Driver contact information
- Share location with contacts

### 4.5 Progressive Web Application (PWA) Implementation

The PWA architecture enables offline functionality and app-like experience without app store distribution.

#### Service Worker Capabilities
- **Caching Strategies**:
  - Static assets: Cache-first strategy
  - API responses: Network-first with cache fallback
  - Images: Stale-while-revalidate
  
- **Offline Features**:
  - Browse cached routes and schedules
  - View saved bookings
  - Access downloaded tickets
  - Queue booking requests for later submission
  - Cache search results for offline viewing

#### Background Sync
- Booking requests made offline are queued
- Automatic submission when connectivity restored
- User notification of sync status
- Conflict resolution for duplicate bookings

#### Push Notifications
- Booking confirmations
- Trip reminders (24h, 2h before departure)
- Delay notifications
- Promotional offers
- Agent commission updates

#### Installation Features
- Add to home screen prompt
- Standalone display mode
- Custom app icon
- Splash screen with branding

### 4.6 Mobile Money Integration

The payment system supports multiple mobile money providers prevalent in African markets.

#### Supported Providers
- **Airtel Money**: Zambia, multiple African countries
- **MTN Mobile Money**: Zambia, multiple African countries
- **M-Pesa**: Kenya, Tanzania, other markets (expandable)

#### Payment Flow
1. User selects mobile money provider
2. Enters phone number
3. System initiates payment request via provider API
4. User receives USSD prompt on phone
5. User enters PIN to authorize
6. Provider webhook confirms payment
7. Booking status updated to confirmed
8. Ticket generated and sent via SMS/email

#### Security Features
- Payment tokenization
- Webhook signature verification
- Duplicate payment prevention
- Automatic refund on booking cancellation
- Transaction logging for reconciliation

### 4.7 Review and Rating System

A comprehensive feedback mechanism builds trust and enables quality improvement.

#### Review Components
- **Overall Rating**: 1-5 stars
- **Category Ratings**: Punctuality, Comfort, Service, Value
- **Written Review**: Free-text feedback
- **Photo Upload**: Optional images (interior, exterior)
- **Trip Verification**: Only confirmed passengers can review

#### Review Aggregation
- Operator average rating
- Route-specific ratings
- Driver ratings
- Bus condition ratings
- Trend analysis over time

#### Review Moderation
- Automated spam detection
- Profanity filtering
- Admin review queue
- Response capability for operators

### 4.8 Data Synchronization and Offline-First Architecture

A critical innovation enabling functionality in low-connectivity environments.

#### IndexedDB Schema
```javascript
// Offline data stores
- bookings: Cached booking records
- routes: Available routes and schedules
- companies: Bus operator information
- seats: Seat availability snapshots
- queue: Pending sync operations
```

#### Sync Algorithm
1. Detect online/offline status
2. Queue write operations when offline
3. Store operations with timestamp and unique ID
4. On connectivity restoration:
   - Process queue in order
   - Handle conflicts (last-write-wins with user notification)
   - Update local cache with server response
   - Notify user of sync completion

### 4.9 Security Architecture

#### Authentication
- Email-based authentication (JWT tokens)
- Password hashing (bcrypt)
- Session management
- Role-based access control (RBAC)

#### Authorization
- Role-specific API endpoints
- Resource ownership verification
- Rate limiting per user
- IP-based blocking for suspicious activity

#### Data Protection
- HTTPS encryption
- Database encryption at rest
- PII handling compliance
- Secure payment processing
- SQL injection prevention
- XSS protection
- CSRF token validation

---

## 5. NOVEL FEATURES

The following features distinguish Vayazed from existing solutions and represent patentable innovations:

### 5.1 Unified Multi-Stakeholder Platform

**Novelty**: No existing system simultaneously serves customers, operators, drivers, agents, and administrators with role-specific interfaces while maintaining data consistency.

**Claims**:
- Single codebase serving five distinct user roles
- Shared data model with role-based access
- Real-time synchronization across all stakeholder views
- Unified API supporting all user interactions

### 5.2 Agent Booking System with Automated Commission Management

**Novelty**: Existing travel agent systems focus on airlines and hotels, excluding informal bus transportation agents. Vayazed introduces agent-specific features for intercity bus booking.

**Claims**:
- Automated commission calculation based on configurable rules
- Tiered commission system with automatic upgrades
- Bulk booking workflow for group travel
- Customer relationship management for agents
- Commission withdrawal and payout management
- Integration with mobile money for agent payouts

### 5.3 Multi-Provider GPS Tracking Aggregation

**Novelty**: Current tracking solutions are provider-specific. Vayazed aggregates multiple GPS providers into a unified tracking interface.

**Claims**:
- Integration layer for multiple GPS providers (Ctrack, Tramigo, Teltonika)
- Normalized data format across providers
- Automatic failover between providers
- Driver app fallback for vehicles without GPS hardware
- Unified map interface regardless of provider

### 5.4 Offline-First PWA for Transactional Bookings

**Novelty**: While PWAs exist for content applications, Vayazed extends offline functionality to complex transactional booking operations.

**Claims**:
- Complete booking workflow available offline
- IndexedDB-based data persistence
- Background sync for queued transactions
- Conflict resolution for offline operations
- Seat availability caching with validity checks

### 5.5 Integrated Mobile Money Payment Gateway

**Novelty**: Existing booking systems require third-party payment integrations. Vayazed provides native mobile money integration.

**Claims**:
- Direct integration with Airtel Money and MTN Mobile Money APIs
- Unified payment interface across providers
- Webhook-based confirmation handling
- Automatic refund processing
- Payment reconciliation dashboard

### 5.6 Dynamic Pricing with Route-Level Configuration

**Novelty**: Bus operators can configure pricing multipliers at the route level, enabling demand-based pricing not available in basic booking systems.

**Claims**:
- Route-specific pricing multipliers
- Time-based pricing adjustments
- Operator-defined pricing rules
- Customer-facing price comparison
- Revenue optimization analytics

### 5.7 QR Code Ticket Verification System

**Novelty**: Digital tickets with QR codes for operator verification, replacing paper tickets.

**Claims**:
- Unique QR code generation per booking
- Operator scanning capability for verification
- Anti-fraud measures (unique codes, one-time use)
- Offline QR code generation
- Integration with manifest display

### 5.8 Multi-Criteria Review and Rating System

**Novelty**: Comprehensive review system with multiple rating categories, verification, and aggregation.

**Claims**:
- Multi-dimensional rating (Punctuality, Comfort, Service, Value)
- Verified review system (only confirmed passengers)
- Operator response capability
- Trend analysis and reporting
- Review-based search filtering

---

## 6. POTENTIAL APPLICATIONS

### 6.1 Primary Applications

#### Intercity Bus Transportation
- Primary use case for Sub-Saharan African markets
- Serves long-distance travel between cities
- Addresses both luxury coach and economy segments

#### Urban Commuter Services
- Adaptation for city-to-suburb commuter routes
- Corporate shuttle management
- University transportation services

#### Tourism Transportation
- Safari tour operator integration
- Airport shuttle services
- Tourist route management

### 6.2 Secondary Applications

#### Logistics and Parcel Services
- Bus-based parcel delivery booking
- Track parcel location via bus GPS
- Sender/recipient notifications

#### Charter and Private Hire
- Private bus charter booking
- Event transportation management
- Corporate event coordination

#### Public Transportation Integration
- Municipal bus system management
- Government transportation oversight
- Subsidized transportation programs

### 6.3 Geographic Applications

#### Zambia (Primary Market)
- Lusaka-based launch
- Extension to all major Zambian routes
- Integration with Zambian mobile money providers

#### Regional Expansion
- Malawi, Zimbabwe, Tanzania
- Adaptation to local mobile money systems
- Multi-currency support

#### Continental Application
- West Africa (Ghana, Nigeria)
- East Africa (Kenya, Uganda, Rwanda)
- North Africa (adaptation for different payment systems)

### 6.4 Industry Applications

#### Transportation Industry
- Bus operators (primary)
- Minibus/taxi associations
- Ferry and boat operators (adaptation)

#### Travel and Tourism
- Travel agency integration
- Tour operator partnerships
- Hotel-transportation bundles

#### Financial Services
- Mobile money provider partnerships
- Micro-lending for agents (future)
- Insurance integration for trip protection

---

## 7. ADVANTAGES AND BENEFITS

### 7.1 Advantages Over Existing Solutions

#### For Passengers (End Users)

**Convenience**
- Single platform to compare all operators
- No need to visit multiple booking offices
- 24/7 booking availability
- Instant confirmation and ticket generation

**Transparency**
- Clear pricing with no hidden fees
- Verified reviews from actual passengers
- Real-time bus tracking
- Operator ratings and comparisons

**Accessibility**
- PWA works on any device
- Offline functionality for low-connectivity areas
- Mobile money payments for unbanked users
- Multi-language support potential

**Cost Savings**
- Price comparison across operators
- Loyalty rewards and discounts
- No booking office travel costs
- Transparent commission disclosure

#### For Bus Operators (Companies)

**Operational Efficiency**
- Digital booking reduces manual processes
- Real-time manifest access
- Driver coordination dashboard
- Fleet utilization analytics

**Revenue Optimization**
- Dynamic pricing capabilities
- Reduced no-shows (paid bookings)
- Customer reach expansion
- Marketing through platform presence

**Customer Insights**
- Booking patterns and trends
- Customer feedback analysis
- Popular route identification
- Demand forecasting

**Cost Reduction**
- Reduced booking office overhead
- Digital tickets save printing costs
- Automated communication
- Reduced fraud with QR verification

#### For Drivers

**Trip Management**
- Clear trip assignments
- Digital passenger manifest
- Trip status tracking
- Earnings transparency

**Communication**
- Passenger count visibility
- Route information access
- Emergency contact capability
- Performance feedback

#### For Travel Agents

**Digital Transformation**
- Professional booking tools
- Commission tracking automation
- Customer database management
- Competitive advantage over informal agents

**Revenue Growth**
- Commission earnings visibility
- Tier upgrades for volume
- Bulk booking efficiency
- Expanded service offerings

**Business Management**
- Transaction history
- Tax-ready reports
- Customer relationship tools
- Marketing support from platform

#### For Administrators (Platform Owners)

**Ecosystem Control**
- Comprehensive oversight dashboard
- User verification and compliance
- Dispute resolution tools
- Quality control mechanisms

**Revenue Streams**
- Booking commissions
- Agent transaction fees
- Operator subscription fees
- Premium listing fees

**Data Assets**
- Travel pattern analytics
- Market intelligence
- Demand forecasting data
- Partnership opportunities

### 7.2 Societal Benefits

#### Financial Inclusion
- Serves unbanked populations through mobile money
- Enables small-scale agents to participate digitally
- Transparent pricing prevents exploitation

#### Transportation Safety
- Verified operators and drivers
- Real-time tracking for accountability
- Digital records for incident investigation
- Review system encourages quality service

#### Economic Development
- Digitizes informal transportation sector
- Creates agent employment opportunities
- Improves operator business efficiency
- Facilitates tourism through better transport

#### Environmental Benefits
- Optimized routing reduces fuel consumption
- Digital tickets reduce paper waste
- Efficient booking reduces empty seats
- Fleet utilization analytics improve efficiency

### 7.3 Technical Advantages

#### Performance
- Sub-3-second page load times
- Offline functionality ensures usability
- Real-time updates without page refresh
- Scalable architecture handles growth

#### Security
- Enterprise-grade authentication
- Secure payment processing
- Data encryption at rest and in transit
- Regular security updates

#### Reliability
- 99.9% uptime target
- Redundant GPS tracking
- Offline data persistence
- Automated backups

#### Maintainability
- Modern technology stack
- Modular architecture
- Comprehensive documentation
- Automated testing

---

## 8. TECHNICAL SPECIFICATIONS

### 8.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │Customer │  │Company  │  │ Driver  │  │ Agent   │  ...   │
│  │  PWA    │  │  PWA    │  │  PWA    │  │  PWA    │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                           │
                    ┌──────▼──────┐
                    │  Service    │
                    │   Worker    │
                    │   (PWA)     │
                    └──────┬──────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Application                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │   API   │ │  Pages  │ │  SSR    │ │   PWA   │    │  │
│  │  │ Routes  │ │  (UI)   │ │  Engine │ │ Manifest│    │  │
│  │  └────┬────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────┼──────────────────────────────────────────────┘  │
└──────────┼──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                     SERVICE LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Auth Svc  │ │Booking   │ │Tracking  │ │Payment   │      │
│  │          │ │Service   │ │Service   │ │Service   │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │            │            │            │             │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐      │
│  │ Agent    │ │ Review   │ │ Notify   │ │ Sync     │      │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   IndexedDB  │  │    Redis     │     │
│  │   (Main DB)  │  │   (Offline)  │  │   (Cache)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Airtel   │ │   MTN    │ │  Ctrack  │ │ Tramigo  │      │
│  │  Money   │ │  Mobile  │ │   GPS    │ │   GPS    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Flutterwave│ │ Firebase │ │  Email   │ │   SMS    │      │
│  │ (Cards)  │ │  (Push)  │ │  (SMTP)  │ │  (AT)    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Database Schema (Key Tables)

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- customer, company, driver, agent, admin
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Bus Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP
);

-- Buses
CREATE TABLE buses (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    registration_number VARCHAR(50) UNIQUE,
    capacity INTEGER NOT NULL,
    amenities JSONB, -- ["wifi", "ac", "usb", "tv", "snacks"]
    layout_type VARCHAR(50), -- "2-2", "2-1", "1-1"
    gps_device_id VARCHAR(100),
    gps_provider VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP
);

-- Routes
CREATE TABLE routes (
    id UUID PRIMARY KEY,
    origin_city VARCHAR(255) NOT NULL,
    destination_city VARCHAR(255) NOT NULL,
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    intermediate_stops JSONB,
    base_price DECIMAL(10,2),
    pricing_multiplier DECIMAL(3,2) DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP
);

-- Trips (Scheduled departures)
CREATE TABLE trips (
    id UUID PRIMARY KEY,
    bus_id UUID REFERENCES buses(id),
    route_id UUID REFERENCES routes(id),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    driver_id UUID REFERENCES users(id),
    available_seats INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    gps_tracking_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id),
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES users(id),
    seats JSONB NOT NULL, -- ["A1", "A2", "B1"]
    passenger_details JSONB NOT NULL,
    total_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    payment_reference VARCHAR(100),
    commission_amount DECIMAL(10,2),
    booking_reference VARCHAR(20) UNIQUE,
    qr_code VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP
);

-- Agents
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    commission_tier VARCHAR(50) DEFAULT 'bronze',
    commission_rate DECIMAL(5,2) DEFAULT 3.00,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    bank_details JSONB,
    mobile_money_number VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    trip_id UUID REFERENCES trips(id),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    punctuality_rating INTEGER,
    comfort_rating INTEGER,
    service_rating INTEGER,
    value_rating INTEGER,
    comment TEXT,
    photos JSONB,
    created_at TIMESTAMP
);

-- GPS Tracking
CREATE TABLE gps_locations (
    id UUID PRIMARY KEY,
    bus_id UUID REFERENCES buses(id),
    trip_id UUID REFERENCES trips(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    timestamp TIMESTAMP NOT NULL,
    provider VARCHAR(50),
    created_at TIMESTAMP
);
```

### 8.3 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User authentication |
| `/api/trips/search` | GET | Search available trips |
| `/api/trips/{id}` | GET | Get trip details |
| `/api/trips/{id}/seats` | GET | Get available seats |
| `/api/bookings` | POST | Create booking |
| `/api/bookings/{id}` | GET | Get booking details |
| `/api/bookings/{id}/cancel` | POST | Cancel booking |
| `/api/payments/initiate` | POST | Initiate payment |
| `/api/payments/callback` | POST | Payment webhook |
| `/api/tracking/{tripId}` | GET | Get real-time location |
| `/api/tracking/{tripId}/subscribe` | WS | WebSocket subscription |
| `/api/agents/bookings` | POST | Agent booking creation |
| `/api/agents/commission` | GET | Get commission summary |
| `/api/agents/payouts` | POST | Request commission payout |
| `/api/companies/buses` | CRUD | Bus management |
| `/api/companies/routes` | CRUD | Route management |
| `/api/companies/analytics` | GET | Company dashboard data |
| `/api/drivers/trips` | GET | Driver trip assignments |
| `/api/drivers/trips/{id}/start` | POST | Start trip |
| `/api/drivers/trips/{id}/end` | POST | End trip |
| `/api/reviews` | POST | Submit review |
| `/api/reviews/{companyId}` | GET | Get company reviews |
| `/api/admin/users` | GET | Admin user management |
| `/api/admin/analytics` | GET | System-wide analytics |

### 8.4 Performance Specifications

| Metric | Target |
|--------|--------|
| Page Load Time | < 3 seconds |
| API Response Time | < 500ms (p95) |
| Time to First Byte (TTFB) | < 600ms |
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100ms |
| Offline Functionality | Full booking flow |
| Real-Time Tracking Latency | < 2 seconds |
| Concurrent Users | 10,000+ |
| Database Query Time | < 100ms |
| WebSocket Connection Time | < 1 second |

### 8.5 Security Specifications

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT with 24-hour expiry |
| Password Hashing | bcrypt (12 rounds) |
| HTTPS | TLS 1.3 required |
| CORS | Configured per environment |
| Rate Limiting | 100 requests/15 min per IP |
| SQL Injection | Parameterized queries |
| XSS Protection | Content Security Policy |
| CSRF Protection | Token validation |
| Input Validation | Zod schema validation |
| Payment Security | PCI DSS compliant gateway |
| Data Encryption | AES-256 at rest |

### 8.6 Technology Stack Details

**Frontend**
- Next.js 16.1.6 (App Router)
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 4.1.16
- Service Worker for PWA

**Backend**
- Node.js 20.x
- Next.js API Routes
- WebSocket (Socket.IO)

**Database**
- SQLite (development)
- PostgreSQL 15 (production)
- IndexedDB (client-side)

**External Services**
- Flutterwave (card payments)
- Airtel Money API
- MTN Mobile Money API
- Ctrack GPS API
- Firebase Cloud Messaging
- Africa's Talking SMS

---

## 9. DRAWINGS AND DIAGRAMS

[Note: The following diagrams should be prepared as professional drawings for patent submission]

### 9.1 System Architecture Diagram
- Shows the relationship between client applications, server infrastructure, and external services
- Illustrates data flow between components

### 9.2 User Interface Flow Diagrams

#### Customer Booking Flow
```
Home → Search → Results → Select Bus → Choose Seats → 
Enter Details → Payment → Confirmation → Ticket
```

#### Agent Booking Flow
```
Dashboard → New Booking → Search → Select Bus → 
Choose Seats → Enter Passengers → Review Commission → 
Process Payment → Generate Tickets
```

### 9.3 Database Entity Relationship Diagram
- Shows all database tables and their relationships
- Highlights key foreign keys and constraints

### 9.4 Real-Time Tracking Sequence Diagram
```
GPS Device → Provider API → Webhook → Database → 
WebSocket Server → Client Application → Map Update
```

### 9.5 Offline Synchronization Flow Diagram
```
User Action → Check Connectivity → If Offline: Queue in IndexedDB → 
When Online: Process Queue → Sync with Server → Update Local Cache
```

### 9.6 Commission Calculation Algorithm Flowchart
```
Booking Created → Check Agent Tier → Apply Base Rate → 
Add Route Bonus → Add Operator Bonus → Calculate Total → 
Store in Database → Update Agent Earnings
```

---

## 10. CLAIMS (Preliminary)

The following claims are suggested for patent protection:

### Independent Claims

**Claim 1**: A computer-implemented method for managing intercity bus bookings across multiple stakeholders, comprising:
- Providing a unified web application accessible to customers, bus operators, drivers, travel agents, and administrators;
- Enabling customers to search, compare, and book trips across multiple bus operators through a single interface;
- Providing bus operators with fleet management, route configuration, and booking analytics capabilities;
- Enabling travel agents to create bookings on behalf of customers with automated commission calculation and tracking;
- Providing drivers with trip management and real-time location sharing capabilities;
- Providing administrators with system-wide oversight and user management tools;
- Wherein all stakeholder interactions are synchronized in real-time across the platform.

**Claim 2**: A system for agent-based bus booking with commission management, comprising:
- A registration and verification module for travel agents;
- A commission configuration module for defining tiered commission rates;
- A booking module enabling agents to create bookings for multiple passengers;
- A commission calculation engine that automatically calculates commissions based on booking value and agent tier;
- A payout module for agents to withdraw accumulated commissions;
- A customer relationship management module for agents to track customer interactions.

**Claim 3**: A method for providing offline bus booking functionality in a web application, comprising:
- Caching route, schedule, and operator data in client-side storage (IndexedDB);
- Enabling search and browsing of cached data without internet connectivity;
- Queueing booking requests created offline for later submission;
- Automatically submitting queued requests when connectivity is restored;
- Resolving conflicts between offline operations and server state;
- Providing notification to users of sync status.

**Claim 4**: A system for aggregating real-time GPS tracking from multiple providers, comprising:
- Integration modules for multiple GPS tracking providers (Ctrack, Tramigo, Teltonika);
- A normalization layer that converts provider-specific data formats to a unified format;
- A failover mechanism that switches between providers or fallback tracking methods;
- A WebSocket server for pushing real-time location updates to subscribed clients;
- An ETA calculation module based on distance, speed, and historical data.

### Dependent Claims

**Claim 5**: The method of Claim 1, further comprising a mobile money payment integration module supporting Airtel Money and MTN Mobile Money.

**Claim 6**: The method of Claim 1, further comprising a review and rating system that verifies reviewers as confirmed passengers.

**Claim 7**: The system of Claim 2, wherein the commission calculation includes route-specific bonuses and operator-specific rates.

**Claim 8**: The method of Claim 3, wherein the conflict resolution includes notifying users of duplicate bookings and providing options to cancel or modify.

**Claim 9**: The system of Claim 4, further comprising a driver application fallback for vehicles without dedicated GPS hardware.

**Claim 10**: The method of Claim 1, further comprising dynamic pricing capabilities allowing operators to configure route-level pricing multipliers.

---

## 11. PRIOR ART SEARCH RESULTS

### Related Patents and Publications

1. **CN103854508A - City-bus real-time management system**
   - Focuses on urban bus systems
   - Does not address intercity travel or agent networks
   - Lacks mobile money integration

2. **US20150006428A1 - Freight shipment booking system**
   - Addresses freight, not passenger booking
   - No agent commission system
   - No real-time passenger tracking

3. **Various PWA Patents**
   - Address offline functionality generally
   - Do not apply PWA concepts to complex transactional booking systems

### Distinguishing Features

Vayazed distinguishes itself from prior art through:
- Multi-stakeholder unified platform (not addressed in prior art)
- Agent booking with commission management (novel for bus transportation)
- Mobile money integration (not addressed in existing patents)
- Offline-first transactional booking (extends PWA concepts)
- Multi-provider GPS aggregation (novel approach)

---

## 12. COMMERCIALIZATION PLAN

### Market Opportunity

**Total Addressable Market (TAM)**
- African intercity bus market: $15+ billion annually
- Mobile money users in Africa: 500+ million
- Travel agents in Sub-Saharan Africa: Estimated 100,000+

**Serviceable Addressable Market (SAM)**
- Zambian intercity bus market: $200+ million annually
- Expansion to neighboring countries: $1+ billion combined

### Revenue Model

1. **Commission on Bookings**: 3-5% fee on each transaction
2. **Agent Transaction Fees**: Small fee per agent booking
3. **Operator Subscriptions**: Monthly fee for premium features
4. **Premium Listings**: Fee for featured operator placement
5. **Advertising**: Relevant advertising to users

### Competitive Advantage

- First-mover advantage in comprehensive agent system
- Mobile money integration for African markets
- Offline functionality for connectivity-challenged regions
- Multi-provider tracking aggregation
- Unified platform reducing integration complexity

---

## 13. APPENDICES

### Appendix A: Glossary of Terms

- **PWA**: Progressive Web Application
- **GPS**: Global Positioning System
- **ETA**: Estimated Time of Arrival
- **QR Code**: Quick Response Code
- **API**: Application Programming Interface
- **WebSocket**: Protocol for real-time communication
- **IndexedDB**: Browser-based database for offline storage
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control

### Appendix B: Sample Screenshots

[Include screenshots of all five dashboard interfaces]

### Appendix C: API Documentation

[Reference to complete API documentation]

### Appendix D: User Flow Diagrams

[Include detailed user flow diagrams for each user role]

---

## 14. DECLARATION

I/We, the undersigned inventor(s), declare that:

1. I/We are the original inventor(s) of the invention described in this disclosure.
2. The invention was not made under any contract or grant requiring assignment to another party.
3. I/We have not publicly disclosed this invention prior to the filing of this document.
4. All information provided in this disclosure is accurate and complete to the best of my/our knowledge.

**Inventor(s):**

_________________________  
Name: [To be filled]  
Date: [To be filled]

_________________________  
Name: [To be filled]  
Date: [To be filled]

[Add additional inventors as needed]

---

## 15. CONTACT INFORMATION

**Primary Contact**: [To be filled]  
**Email**: [To be filled]  
**Phone**: [To be filled]  
**Address**: [To be filled]

**Patent Attorney**: [To be assigned]  
**Reference Number**: [To be assigned]

---

*This document is confidential and intended solely for the purpose of patent application preparation. Unauthorized distribution is prohibited.*

**Document Version**: 1.0  
**Last Updated**: March 14, 2026