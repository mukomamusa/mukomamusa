# Deployment Guide - VayaZed Bus Booking System

This guide covers deploying the VayaZed Bus Booking System to production.

## Prerequisites

- Node.js 18+ installed on server
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)
- Server with at least 1GB RAM

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd zambia-bus-booking
vercel
```

4. **Configure Environment Variables**
- Go to Vercel Dashboard
- Select your project
- Go to Settings > Environment Variables
- Add: `JWT_SECRET=your-secure-random-string`

5. **Deploy to Production**
```bash
vercel --prod
```

**Note:** SQLite database will be ephemeral on Vercel. Consider using a persistent database like PostgreSQL or MySQL for production.

---

### Option 2: VPS/Cloud Server (Ubuntu)

Deploy on your own server for full control.

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### 2. Upload Application

```bash
# On your local machine
cd zambia-bus-booking
tar -czf zambia-bus-booking.tar.gz .

# Upload to server
scp zambia-bus-booking.tar.gz user@your-server:/home/user/

# On server
cd /home/user
tar -xzf zambia-bus-booking.tar.gz -C /var/www/zambia-bus-booking
cd /var/www/zambia-bus-booking
```

#### 3. Install Dependencies and Build

```bash
npm install
npm run build
```

#### 4. Configure Environment Variables

```bash
# Create .env.local file
nano .env.local

# Add:
JWT_SECRET=your-secure-random-string-change-this
NODE_ENV=production
```

#### 5. Start with PM2

```bash
# Start application
pm2 start npm --name "zambia-bus-booking" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 6. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/zambia-bus-booking

# Add:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/zambia-bus-booking /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
```

---

### Option 3: Docker Deployment

Use Docker for containerized deployment.

#### 1. Create Dockerfile

```dockerfile
# zambia-bus-booking/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
# zambia-bus-booking/docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=your-secure-random-string
      - NODE_ENV=production
    volumes:
      - ./bus_booking.db:/app/bus_booking.db
      - ./public/uploads:/app/public/uploads
    restart: unless-stopped
```

#### 3. Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Image Upload Configuration

The system allows companies to upload logos and bus photos. These are stored locally in the `public/uploads` directory.

### Directory Structure

```
public/
└── uploads/
    ├── logos/           # Company logos
    │   └── company_1.jpg
    └── buses/           # Bus images (by bus ID)
        ├── 1/
        │   ├── image_001.jpg
        │   └── image_002.jpg
        └── 2/
            └── image_001.jpg
```

### Setup for VPS Deployment

```bash
# Create upload directories with proper permissions
mkdir -p /var/www/zambia-bus-booking/public/uploads/logos
mkdir -p /var/www/zambia-bus-booking/public/uploads/buses

# Set ownership (if running as www-data user)
chown -R www-data:www-data /var/www/zambia-bus-booking/public/uploads

# Set permissions
chmod -R 755 /var/www/zambia-bus-booking/public/uploads
```

### Upload Limits

- **Company Logo:** Single image, max 2MB
- **Bus Photos:** Up to 5 images per bus, max 2MB each
- **Allowed Types:** JPEG, PNG, WebP, GIF

### Storage Considerations

For production with many companies:
- Consider cloud storage (AWS S3, Cloudflare R2)
- Use a CDN for serving images
- Implement image compression/resizing
- Set up proper backup for uploads directory

### Nginx Configuration for Large Uploads

If uploads fail, increase Nginx limits:

```nginx
# In nginx.conf or site configuration
client_max_body_size 10M;
```

---

## Database Considerations

### SQLite (Current Setup)

**Pros:**
- Simple, no separate database server
- Good for small to medium traffic
- Easy backup (just copy the .db file)

**Cons:**
- Not suitable for high concurrency
- Limited scalability
- File-based (can be lost on serverless platforms)

**Backup:**
```bash
# Backup database
cp bus_booking.db bus_booking_backup_$(date +%Y%m%d).db

# Restore
cp bus_booking_backup_20241225.db bus_booking.db
```

### Migrating to PostgreSQL (Recommended for Production)

For production with higher traffic, consider PostgreSQL:

1. **Install PostgreSQL**
```bash
sudo apt install postgresql postgresql-contrib
```

2. **Update Dependencies**
```bash
npm install pg
npm uninstall better-sqlite3
```

3. **Update Database Code**
- Replace better-sqlite3 with pg
- Update queries to PostgreSQL syntax
- Use connection pooling

---

## Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall (UFW on Ubuntu)
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs
- [ ] Use environment variables for secrets
- [ ] Disable debug mode

---

## Performance Optimization

### 1. Enable Caching

Add caching headers in next.config.js:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### 2. Database Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_routes_date ON routes(date);
CREATE INDEX idx_routes_origin_dest ON routes(origin, destination);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_route ON bookings(route_id);
```

### 3. Enable Compression

Nginx automatically compresses responses. Ensure gzip is enabled:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## Monitoring

### 1. PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs zambia-bus-booking

# Monitor resources
pm2 monit
```

### 2. Setup Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

---

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
nano /home/user/backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
DB_PATH="/var/www/zambia-bus-booking/bus_booking.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/bus_booking_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "bus_booking_*.db" -mtime +7 -delete

# Make executable
chmod +x /home/user/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/user/backup.sh
```

### 2. Application Backup

```bash
# Backup entire application
tar -czf zambia-bus-booking-backup-$(date +%Y%m%d).tar.gz /var/www/zambia-bus-booking
```

### 3. Image Uploads Backup

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /var/www/zambia-bus-booking/public/uploads

# Or rsync to backup location
rsync -avz /var/www/zambia-bus-booking/public/uploads/ /backup/uploads/
```

---

## Scaling Considerations

### Horizontal Scaling

For high traffic:

1. **Load Balancer:** Use Nginx or cloud load balancer
2. **Multiple Instances:** Run multiple app instances
3. **Shared Database:** Use PostgreSQL or MySQL
4. **Session Storage:** Use Redis for sessions
5. **CDN:** Use Cloudflare or similar for static assets

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching
- Use connection pooling

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs zambia-bus-booking

# Check port availability
sudo netstat -tulpn | grep 3000

# Restart application
pm2 restart zambia-bus-booking
```

### Database Issues

```bash
# Check database file permissions
ls -la bus_booking.db

# Fix permissions
chmod 644 bus_booking.db
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart application
pm2 restart zambia-bus-booking
```

---

## Maintenance

### Regular Tasks

- **Daily:** Check logs for errors
- **Weekly:** Review database backups
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

### Updates

```bash
# Update dependencies
npm update

# Rebuild
npm run build

# Restart
pm2 restart zambia-bus-booking
```

---

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Check Next.js documentation
4. Contact development team

---

**Deployment checklist completed! Your application is ready for production.** 🚀