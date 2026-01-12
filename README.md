# Document Scanning & OCR Automation System

## Overview

This project is a web-based document scanning and processing system designed to automate identity data extraction and registration workflows for businesses such as parking facilities, car rental companies, and similar service providers.

The application enables document scanning or file upload and automatically extracts relevant data, significantly reducing processing time and human error.

## Live Demo
https://document-scan.great-site.net/Document-scan

---

## Features

### Document Scanning and Upload

The system supports scanning or uploading the following document types:

* National ID cards
* Passports
* Driver’s licenses

### MRZ and OCR Processing

* National ID cards and passports are processed using **Machine Readable Zone (MRZ)** recognition

* Extracted data includes:

  * Full name
  * Document number
  * Date of birth
  * Expiration date
  * Nationality

* Driver’s licenses are processed using OCR to extract the corresponding identity information

### Data Management

* Extracted data is displayed in a structured table
* Users can review and manually edit the information before submission

### Data Submission

* With a single action, data can be sent to:

  * a database
  * an ERP system
  * any third-party system via API integration

---

## Technology Stack

* Frontend: HTML, JavaScript
* Backend: PHP
* OCR and Image Processing: Google Vision API

---

## Security

* Sensitive configuration values and API keys are stored in a `.env` file
* The `.env` file is excluded from version control via `.gitignore`

---

## Use Cases

* Automated customer identity registration
* Faster onboarding and verification workflows
* Reduction of manual data entry errors
* Seamless integration with existing systems and infrastructure

---

## Notes

The project is designed with extensibility in mind and can be adapted to various operational requirements and business use cases.

---


## Author

**harrisstef**

This project is part of my personal portfolio.
