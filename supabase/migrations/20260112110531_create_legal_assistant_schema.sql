/*
  # Dijital Katip - Legal Assistant Database Schema

  ## Overview
  This migration creates the database structure for a Turkish legal assistant application
  that helps users draft formal legal petitions (Dilekçe) through conversational AI.

  ## New Tables

  ### 1. cases
  Stores individual legal cases/petitions being worked on
  - `id` (uuid, primary key) - Unique case identifier
  - `created_at` (timestamptz) - When the case was created
  - `updated_at` (timestamptz) - Last modification time
  - `status` (text) - Case status: 'in_progress' or 'completed'
  - `case_type` (text) - Type of legal case (consumer, labor, family, criminal, civil)
  - `title` (text) - Brief title/description of the case

  ### 2. documents
  Stores the structured petition document for each case
  - `id` (uuid, primary key) - Unique document identifier
  - `case_id` (uuid, foreign key) - References the parent case
  - `header` (text) - Court/institution name
  - `plaintiff_details` (text) - Plaintiff information (Davacı)
  - `defendant_details` (text) - Defendant information (Davalı)
  - `subject` (text) - Subject line of the petition (Konu)
  - `incident_narrative` (text) - Main body explaining the situation
  - `legal_grounds` (text) - Legal basis and articles (Hukuki Sebepler)
  - `evidence_list` (text) - List of evidence (Hukuki Deliller)
  - `conclusion_request` (text) - Final request/conclusion (Sonuç ve İstem)
  - `updated_at` (timestamptz) - Last document update time

  ### 3. messages
  Stores chat conversation history for each case
  - `id` (uuid, primary key) - Unique message identifier
  - `case_id` (uuid, foreign key) - References the parent case
  - `role` (text) - Message sender: 'user' or 'assistant'
  - `content` (text) - Message content
  - `created_at` (timestamptz) - When the message was sent

  ## Security
  - RLS enabled on all tables
  - Public access policies for demo purposes (can be restricted later)
*/

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'in_progress',
  case_type text DEFAULT '',
  title text DEFAULT ''
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  header text DEFAULT '',
  plaintiff_details text DEFAULT '',
  defendant_details text DEFAULT '',
  subject text DEFAULT '',
  incident_narrative text DEFAULT '',
  legal_grounds text DEFAULT '',
  evidence_list text DEFAULT '',
  conclusion_request text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode)
CREATE POLICY "Allow public read access to cases"
  ON cases FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to cases"
  ON cases FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to cases"
  ON cases FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to documents"
  ON documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to documents"
  ON documents FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to documents"
  ON documents FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to messages"
  ON messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);