#!/bin/bash
# ==============================================================================
# JalRakshak AI — LocalStack AWS Initialization Script
# Automatically creates DynamoDB tables, S3 buckets, and SES identities locally
# ==============================================================================

echo "Initializing JalRakshak AI AWS resources on LocalStack..."

# 1. Create S3 Bucket for Report Evidence Images
awslocal s3 mb s3://jalrakshak-report-images-dev --region ap-south-1

# 2. Create DynamoDB Tables
awslocal dynamodb create-table \
    --table-name JalRakshak-Reports-dev \
    --attribute-definitions AttributeName=reportId,AttributeType=S \
    --key-schema AttributeName=reportId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-south-1

awslocal dynamodb create-table \
    --table-name JalRakshak-UserPreferences \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-south-1

awslocal dynamodb create-table \
    --table-name JalRakshak-Notifications \
    --attribute-definitions AttributeName=notificationId,AttributeType=S \
    --key-schema AttributeName=notificationId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-south-1

# 3. Verify SES Sender Identity
awslocal ses verify-email-identity --email-address alerts@jalrakshak.org --region ap-south-1

# 4. Create SNS Alert Topic
awslocal sns create-topic --name jalrakshak-flood-alerts-dev --region ap-south-1

echo "LocalStack AWS resources successfully provisioned for JalRakshak AI."
