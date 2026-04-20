# ☁️ Cloud Computing Integration — Rain Forecasting System

This project is designed as a **Cloud-Native Application**, leveraging modern cloud computing principles and services to ensure scalability, reliability, and high availability.

## 🏛️ Cloud Architecture
The system follows a **Microservices Architecture** deployed across multiple cloud layers:

1.  **Frontend (SaaS/Static Hosting):**
    *   Hosted on **AWS S3** as a static website.
    *   Distributed via **AWS CloudFront** (CDN) for low-latency broad network access.
2.  **Application Logic (PaaS/IaaS):**
    *   **Node.js Backend:** Deployed on **AWS EC2** (Elastic Compute Cloud) using **PM2** for process management.
    *   **ML Microservice:** Flask-based service running on the same EC2 instance, utilizing optimized Python environments.
3.  **Database (DBaaS):**
    *   **MongoDB Atlas:** A fully managed cloud database service providing automated scaling, backups, and global distribution.
4.  **Infrastructure as Code (IaC):**
    *   **AWS CloudFormation:** Automated provisioning of VPCs, Security Groups, EC2 instances, and S3 buckets.
    *   **Docker & Docker Compose:** Containerization for environment parity between local development and cloud production.

## 🚀 Key Cloud Characteristics Implemented

### 1. On-Demand Self-Service
Using **CloudFormation** templates (`/infrastructure/aws-cloudformation.yml`), the entire infrastructure can be provisioned automatically without human intervention from the cloud provider.

### 2. Broad Network Access
The application is accessible from any standard web browser. The frontend is hosted in an **S3 Bucket** with public access, and the backend API is exposed via an **Elastic IP**.

### 3. Resource Pooling
By using **EC2 t3.small** instances, the project utilizes a multi-tenant environment where physical resources are pooled and dynamically allocated to virtual instances.

### 4. Rapid Elasticity
The architecture is ready for **Auto-Scaling**. By putting the EC2 instances into an **AWS Auto Scaling Group** and behind an **Application Load Balancer (ALB)**, the system can automatically scale out during heavy weather data processing loads.

### 5. Measured Service
Cloud resources are monitored using **AWS CloudWatch**, providing detailed metrics on CPU utilization, network traffic, and storage consumption.

## 🐳 Containerization (Cloud-Native Development)
We use **Docker** to package each microservice with its own dependencies:
*   `server/Dockerfile`: Node.js environment.
*   `ml/Dockerfile`: Python 3.11 environment with Scikit-Learn.
*   `client/Dockerfile`: Nginx-based frontend serving.
*   `docker-compose.yml`: Orchestrates the entire stack locally, mimicking a cloud environment.

## 🛠️ Deployment Instructions
Refer to the `infrastructure/` directory for:
*   `aws-cloudformation.yml`: To setup the AWS environment.
*   `deploy.sh`: Automated script to sync code to the cloud.
