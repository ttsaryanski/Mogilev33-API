# Mogilev33 API - [Live API](https://mogilev33-api-1015282011082.europe-west4.run.app) ⚠️Under development

## ℹ️ About the Project

    This REST API was developed for educational purposes, as an exercise in working with TypeScript. The main goal is to practice type safety, apply best practices in code structure, and build server-side logic using Express and TypeScript.
    ⚠️ Note: This project is in production use.

## 🛠️ Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB (with Mongoose)
- RESTful architecture
- Middleware and error handling
- Validation and modular routing

## 🎯 Learning Goals

- Practicing TypeScript in a backend environment
- Structuring a scalable REST API
- Applying type-safe request/response handling
- Implementing authentication and authorization (if present)
- Working with async/await and error management
- Using environment variables and configuration

# SETUP GUIDE

## 1. Install Dependencies

⚠️ **Note:** To install the necessary dependencies for the Mogilev33 API server, open a terminal and run:

```sh
cd MOGILEV33 API
npm install
```

## 2. Environment Variables Configuration

⚠️ **Note:** To run this server, create a `.env` file in the root directory and configure the following environment variables:

### Required Variables:

- **CLOUD_DB_URL**: The connection string for a cloud database (e.g., MongoDB Atlas).  
  _Example:_ `mongodb+srv://username:password@cluster0.mongodb.net/dbname`

- **JWT_SECRET**: A strong, random secret key for signing JSON Web Tokens (JWT).  
  _Example:_ `your_super_secret_key`

- **JWT_REFRESH_SECRET**: A strong, random secret key for signing JSON Web Tokens (JWT).  
  _Example:_ `your_super_secret_key`

- **GCS_BUCKET_NAME**: Bucket name for GCS claud storage.  
  _Example:_ `your_bucket_name`

### Steps to Set Up `.env`:

1. Create a file named `.env` in the root directory.
2. Log in to GCP locally.
3. Add the required environment variables in the following format:

    ```sh
    CLOUD_DB_URL=<your-cloud-database-url>
    JWT_SECRET=<your-jwt-secret>
    JWT_REFRESH_SECRET=<your-jwt-secret>
    GCS_BUCKET_NAME=<your_bucket_name>
    ```

4. Save the file.

## 3. Start the Mogilev33 API Server

⚠️ **Note:** Run the following command to start the server:

```sh
npm start
```

If everything is set up correctly, you should see output similar to:

```
Server running on http://localhost:3000
Successfully connected to the cloud DB!
```

## 4. Use Documentation

```
After server is on, go to http://localhost:3000/api/docs
```
