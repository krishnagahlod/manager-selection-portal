💻 MASTER PROMPT — SUSTAINABILITY CELL MANAGER SELECTION PORTAL

Build a full-stack web application to manage the Manager Selection Process for the Sustainability Cell at IIT Bombay.

This is not a generic task manager. It is a structured selection system designed to:

Reduce operational chaos (currently managed via WhatsApp and spreadsheets)
Improve candidate experience (clear, guided process)
Improve evaluation quality (structured signals instead of memory-based decisions)
Handle ~60–70 applicants and ~15 evaluators
🧠 CONTEXT: HOW THE SELECTION PROCESS WORKS

The selection process has the following stages:

Applications
Candidates apply for one or more verticals:
Events & Operations
Projects & Policies
Web & Design
Groundwork Sessions (VERY IMPORTANT STAGE)
Multiple sessions conducted by current team members
These are:
Mandatory (attendance required)
Spread across multiple days
Purpose:
Help candidates understand the cell, work, expectations
Encourage meaningful interaction and curiosity
There are also optional individual groundworks:
Candidates can talk to team members separately
This shows initiative (important signal)
Assignments (Parallel Stage)
Vertical-specific assignments
Creative and practical in nature
Used to:
Evaluate thinking
Guide interview discussion
Shortlisting
Only candidates who submit assignments are interviewed
Interview (Final Stage)
1 round (sometimes 2)
1–1.5 hours
Conducted by 2+ evaluators
Evaluation based on:
Assignment understanding
Thought process
Initiative (groundworks)
Clarity and motivation
⚠️ CURRENT PROBLEMS TO SOLVE

The tool must explicitly solve:

Attendance tracking is unreliable
Communication is scattered (WhatsApp chaos)
Candidates are confused about process and deadlines
No structured way to track candidate engagement
Assignment evaluation is unstructured
Interview note-taking is inconsistent
No consolidated view of candidate performance
🎯 DESIGN PHILOSOPHY
Keep UI simple, clean, and fast
Focus on clarity over features
Minimize clicks for core actions
Avoid over-engineering
Prioritize high-signal data collection
Do NOT expose evaluation logic to candidates
👥 USER ROLES
1. Candidate

Students applying for manager roles

2. Admin

OCs + current managers conducting the process

🧩 CORE FEATURES
🔐 AUTHENTICATION
Email-based login (Supabase Auth)
Role-based access:
candidate
admin
🏠 CANDIDATE DASHBOARD

The most important page for candidates.

Display clearly:

Upcoming groundwork sessions
Attendance status (e.g., 2/4 mandatory sessions attended)
Assignment status (submitted / pending)
Deadlines
Interview status

Goal: eliminate confusion completely

📅 GROUNDWORK SESSIONS
Admin:
Create sessions:
title
description
date/time
mandatory flag
Candidate:
View all sessions
See which are mandatory
✅ ATTENDANCE SYSTEM (CRITICAL FEATURE)
Each session has a dynamically generated QR code
QR code:
Valid only for a short window (5–10 minutes)
Candidate scans QR → attendance recorded
Admin View:
Session-wise attendance list
Candidate-wise attendance percentage
❓ PRE-GROUNDWORK Q&A SYSTEM

For each session:

Candidates:
Ask questions anonymously
View all questions
Upvote questions
Admin:
View top-voted questions
Mark questions as “answered”

Goal:

Improve session quality
Avoid repetitive questions
🧠 GROUNDWORK LOG (LIGHT EVALUATION SIGNAL)

After each session, candidates submit:

1 key insight
1 important learning
1 remaining question
Admin:
View responses per candidate
Use as hidden evaluation signal
Bonus:
Aggregate responses into session summary (AI-ready structure)
📂 ASSIGNMENT SYSTEM
Admin:
Create assignments:
title
description
vertical
deadline
Candidate:
View assignments based on selected verticals
Submit:
text or file
📊 EVALUATION SYSTEM (ASSIGNMENTS)
Admin Panel:
View all submissions
Evaluate using structured inputs:
Creativity (1–5)
Practicality (1–5)
Effort (1–5)
Comments

Goal:

Light structure without rigidity
Aid memory and comparison
🗓️ INTERVIEW SYSTEM
Admin:
Schedule interview slots (optional)
During interview:

Display:

Candidate profile
Assignment submission
Groundwork insights

Input:

Strengths
Weaknesses
Red flags
Final score (1–10)
📊 ADMIN DASHBOARD (MOST POWERFUL VIEW)

Display per candidate:

Attendance %
Assignment scores
Groundwork participation
Interview scores

Allow:

Filtering by vertical
Sorting candidates

Goal:

Replace gut feeling with structured comparison
📈 OPTIONAL: INDIVIDUAL GROUNDWORK TRACKER

Candidates can log:

Person they spoke to
Key takeaway

Used as:

Indicator of initiative
🔔 NOTIFICATIONS (IF TIME PERMITS)
Email notifications:
Upcoming sessions
Assignment deadlines
Interview scheduling
🧱 TECH STACK
Next.js (App Router)
Supabase (DB + Auth)
Tailwind CSS
Vercel deployment
🎨 UI REQUIREMENTS
Minimal, clean dashboard
Sidebar navigation:
Dashboard
Groundworks
Assignments
Interview
Card-based layout
Mobile responsive
Fast loading
🚫 IMPORTANT CONSTRAINTS
Do NOT expose evaluation criteria to candidates
Do NOT overcomplicate UI
Avoid unnecessary features
Prioritize reliability over fancy UI
🎯 SUCCESS METRICS

The app should:

Reduce confusion for candidates to near zero
Make attendance tracking automatic
Help admins evaluate candidates quickly and fairly
Provide a single source of truth for the entire process
⚡ OUTPUT EXPECTATION
Clean folder structure
Reusable components
Clear API routes
Supabase schema setup
Working UI for both roles
🔥 EXTRA (IF POSSIBLE)
AI summary of groundwork logs
Highlight top candidates automatically based on signals