# README FOR AI
# Thesis Context & Development Guide

---

# IMPORTANT NOTICE (READ FIRST)

THIS PROJECT HAS BEEN MIGRATED.

Previous implementation:

❌ TF-IDF
❌ TF-IDF Vectorizer
❌ TF-IDF Weighting

CURRENT IMPLEMENTATION:

✅ BERT Embedding
✅ Sentence Embedding
✅ Cosine Similarity

This migration has been COMPLETED.

Never regenerate TF-IDF implementation unless explicitly requested.

Whenever discussing:

- methodology
- implementation
- similarity calculation
- ranking
- scoring
- screening
- diagrams
- thesis
- documentation

Always assume the system uses:

BERT Embedding + Cosine Similarity.

NOT TF-IDF.

---

# PROJECT INFORMATION

Title

Penerapan BERT dan Cosine Similarity untuk Sistem Screening dan Scoring CV Otomatis Berbasis Email.

Research Type

Undergraduate Thesis

Field

Natural Language Processing

Artificial Intelligence

Information Retrieval

Web Development

Recruitment System

---

# PROJECT PURPOSE

This website helps Human Resource (HR) perform automatic CV screening.

Applicants DO NOT upload CVs through the website.

Applicants simply send their CVs to the company's recruitment email.

The system automatically:

1.
Reads incoming emails using IMAP.

2.
Downloads attached CVs.

3.
Extracts text from PDF resumes.

4.
Performs NLP preprocessing.

5.
Generates BERT Embeddings.

6.
Calculates Cosine Similarity.

7.
Produces Screening Score.

8.
Ranks all applicants.

9.
Displays results on HR Dashboard.

---

# BUSINESS PROCESS

Applicant

↓

Send CV via Email

↓

Company Email Inbox

↓

IMAP

↓

Download Attachment

↓

PDF Extraction

↓

Text Cleaning

↓

NLP Preprocessing

↓

BERT Embedding

↓

Cosine Similarity

↓

Score Calculation

↓

Candidate Ranking

↓

Store Database

↓

Dashboard

↓

HR Decision

---

# SYSTEM USERS

Only ONE system user exists.

HR / Admin

Applicants are NOT website users.

Applicants only send CV through email.

Applicants:

❌ No Login

❌ No Register

❌ No Upload CV page

Website is used ONLY by HR.

---

# MAIN FEATURES

Authentication

- Login
- Logout

Job Description

- Create Job Description
- Edit Job Description
- Delete Job Description

Email

- Connect Gmail
- IMAP Authentication
- Read Inbox
- Download CV Attachment

CV Processing

- Extract PDF
- Parse Resume
- NLP Cleaning

Artificial Intelligence

- BERT Embedding
- Sentence Embedding
- Cosine Similarity
- Candidate Scoring
- Candidate Ranking

Dashboard

- Candidate List
- Similarity Score
- Candidate Detail
- Ranking

---

# SYSTEM ARCHITECTURE

Frontend

ReactJS

↓

Backend API

NodeJS

↓

Python Service (Flask)

↓

BERT Model

↓

Cosine Similarity

↓

PostgreSQL Database

↓

Dashboard

---

# TECHNOLOGIES

Frontend

ReactJS

Tailwind CSS

Axios

Backend

NodeJS

ExpressJS

JWT Authentication

Python Service

Python

Flask

Sentence Transformers

PyTorch

Scikit-learn

Database

PostgreSQL

Email

IMAP

PDF

pdfplumber

Natural Language Processing

BERT

Sentence Embedding

Cosine Similarity

Deployment

Hostinger VPS

Ubuntu

Nginx

PM2

---

# PROJECT STRUCTURE

frontend/

backend/

python/

models/

controllers/

routes/

middlewares/

services/

database/

uploads/

public/

docs/

---

# MACHINE LEARNING PIPELINE

Incoming Email

↓

Download PDF

↓

Extract Text

↓

Cleaning

↓

Normalize Text

↓

Sentence Embedding (BERT)

↓

Job Description Embedding

↓

Cosine Similarity

↓

Score

↓

Ranking

---

# NLP PIPELINE

Resume Text

↓

Lowercase

↓

Remove Special Characters

↓

Whitespace Normalization

↓

Sentence Preparation

↓

Sentence Embedding

There is NO TF-IDF preprocessing.

---

# BERT IMPLEMENTATION

Model Type

Sentence Transformer

Purpose

Generate dense semantic embeddings.

Input

Resume Text

Output

768-dimensional vector embedding (or according to selected model)

This embedding is compared against Job Description embedding.

---

# COSINE SIMILARITY

Input

Resume Embedding

Job Description Embedding

Output

Similarity Score

Formula

Cos(A,B)=A·B/(||A||×||B||)

Score Range

0

to

1

Higher score

=

Higher relevance

---

# EMAIL PROCESS

Company Email

↓

IMAP Authentication

↓

Read Inbox

↓

Unread Email

↓

Download Attachment

↓

Validate PDF

↓

Extract Resume

↓

Database

---

# DATABASE

Main Tables

users

job_descriptions

emails

candidates

resume_text

screening_results

scoring_results

logs

---

# WEBSITE PAGES

Login

Dashboard

Job Description

Email Inbox

Candidate List

Candidate Detail

Ranking

Settings

Profile

---

# CHAPTER III REQUIREMENTS

Always use this structure.

3.1 Research Method

3.2 SDLC

3.3 Website Overview

3.4 Requirement Analysis

Functional Requirements

Non Functional Requirements

Software Requirements

Hardware Requirements

3.5 System Design

Use Case Diagram

Activity Diagram

Flowchart

Navigation Structure

Database Design

UI Design

3.6 NLP Implementation

3.7 BERT Implementation

3.8 Cosine Similarity Implementation

3.9 IMAP Implementation

3.10 Website Implementation

3.11 Deployment

3.12 Black Box Testing

3.13 User Acceptance Test

---

# REQUIRED DIAGRAMS

Use Case

Activity Diagram

Flowchart

Navigation Structure

ERD

Database Schema

Sequence Diagram (optional)

Deployment Diagram (optional)

---

# THESIS WRITING STYLE

Language

Formal Indonesian

Avoid

Marketing language

Promotional wording

Personal opinions

Always use

Academic writing style.

---

# IMPORTANT RESEARCH NOTES

This research is NOT about creating a job portal.

This research is about automating CV Screening.

Applicants never interact with the website.

The website is only used by HR.

---

# CURRENT PROJECT STATUS

Completed

✔ Literature Review

✔ BERT Integration

✔ Cosine Similarity

✔ IMAP

✔ Email Retrieval

✔ Resume Parsing

✔ Website Development

✔ Dashboard

✔ Authentication

Current

Writing Chapter III

Next

Black Box Testing

UAT

Chapter IV

Chapter V

---

# AI ASSISTANT RULES

When helping this project:

Always assume:

✔ BERT has been implemented.

✔ Cosine Similarity has been implemented.

✔ IMAP has been implemented.

✔ Website has been implemented.

Never suggest replacing BERT with TF-IDF.

Never regenerate TF-IDF implementation.

Never explain TF-IDF unless explicitly requested.

Always prioritize:

BERT

Sentence Embedding

Cosine Similarity

React

NodeJS

Flask

PostgreSQL

IMAP

Natural Language Processing

---

# OUTPUT STYLE

Whenever generating:

Chapter III

Documentation

Flowchart

Activity Diagram

System Design

Explanation

Always describe the CURRENT implementation.

Never describe the previous TF-IDF implementation.

Always remember:

THIS PROJECT USES BERT.

NOT TF-IDF.

---

END OF README