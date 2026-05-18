-- ═══════════════════════════════════════════════════════════════
-- HIVE ASSIGNMENT - SCD TYPE 2 PIPELINE
-- ═══════════════════════════════════════════════════════════════

-- PART 1: DATABASE SETUP
CREATE DATABASE IF NOT EXISTS hive_db;
USE hive_db;

-- ═══════════════════════════════════════════════════════════════
-- TASK 1: INTERNAL & EXTERNAL TABLES + DELIMITER HANDLING
-- ═══════════════════════════════════════════════════════════════

-- 1.1 Create Internal Table with standard delimiter (This will show the comma problem)
CREATE TABLE IF NOT EXISTS customer_int_broken (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");

-- Load data into the broken table
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_int_broken;

-- Check results (Notice how addresses with commas shift the columns)
SELECT * FROM customer_int_broken LIMIT 10;


-- 1.2 Fix with OpenCSVSerde (Handles commas inside quotes correctly)
CREATE TABLE IF NOT EXISTS customer_int (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = ",",
    "quoteChar"     = "\"",
    "escapeChar"    = "\\"
)
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");

-- Load data into the proper internal table
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_int;

-- Verify the fix
SELECT * FROM customer_int LIMIT 10;


-- 1.3 Create External Table with OpenCSVSerde
CREATE EXTERNAL TABLE IF NOT EXISTS customer_ext (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = ",",
    "quoteChar"     = "\"",
    "escapeChar"    = "\\"
)
STORED AS TEXTFILE
LOCATION '/user/hive/data/customer_external'
TBLPROPERTIES ("skip.header.line.count"="1");

-- Load data into the external table
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_ext;

-- Verify
SELECT * FROM customer_ext LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- TASK 2: INTERNAL VS EXTERNAL TABLE BEHAVIOR (DROP)
-- ═══════════════════════════════════════════════════════════════

-- Drop Internal Tables (Metadata AND Data in HDFS are deleted)
DROP TABLE IF EXISTS customer_int_broken;
DROP TABLE IF EXISTS customer_int;

-- Drop External Table (Metadata is deleted, but Data stays in HDFS)
DROP TABLE IF EXISTS customer_ext;

-- Prove the external data survived by recreating the table
CREATE EXTERNAL TABLE IF NOT EXISTS customer_ext (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = ",",
    "quoteChar"     = "\"",
    "escapeChar"    = "\\"
)
STORED AS TEXTFILE
LOCATION '/user/hive/data/customer_external'
TBLPROPERTIES ("skip.header.line.count"="1");

SELECT * FROM customer_ext LIMIT 10;

-- ═══════════════════════════════════════════════════════════════
-- TASK 3: SCD TYPE 2 IMPLEMENTATION
-- ═══════════════════════════════════════════════════════════════

-- Re-prepare the internal table for the pipeline
CREATE TABLE IF NOT EXISTS customer_int (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = ",",
    "quoteChar"     = "\"",
    "escapeChar"    = "\\"
)
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");

LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_int;

-- 3.1 Create the SCD Type 2 Dimension Table
CREATE TABLE IF NOT EXISTS customer_dim_scd2 (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING,
    Start_Date     STRING,
    End_Date       STRING,
    Is_Current     STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = ",",
    "quoteChar"     = "\"",
    "escapeChar"    = "\\"
)
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");

-- Load initial mixed historical data
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_scd2_mixed.csv'
OVERWRITE INTO TABLE customer_dim_scd2;

-- Verify initial load
SELECT COUNT(*) as total_rows, Is_Current FROM customer_dim_scd2 GROUP BY Is_Current;

-- ═══════════════════════════════════════════════════════════════
-- TASK 4: SCD TYPE 2 MERGE LOGIC (INSERT OVERWRITE + UNION)
-- ═══════════════════════════════════════════════════════════════

-- 4.1 Create Staging Table for updates
CREATE TABLE IF NOT EXISTS customer_stage (
    CustomerID     STRING,
    Name           STRING,
    Email          STRING,
    Phone_Number   STRING,
    Address        STRING,
    JOIN_Date      STRING
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = ",",
    "quoteChar"     = "\"",
    "escapeChar"    = "\\"
)
STORED AS TEXTFILE
TBLPROPERTIES ("skip.header.line.count"="1");

-- Load the latest updates into staging
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_stage;

-- 4.2 Perform the Merge using full overwrite pattern
INSERT OVERWRITE TABLE customer_dim_scd2

-- PATH 1: Preserve old history (Is_Current = 0)
SELECT
    d.CustomerID, d.Name, d.Email, d.Phone_Number,
    d.Address, d.JOIN_Date,
    d.Start_Date, d.End_Date, d.Is_Current
FROM customer_dim_scd2 d
WHERE d.Is_Current = '0'

UNION ALL

-- PATH 2: Keep current records that have NOT changed
SELECT
    d.CustomerID, d.Name, d.Email, d.Phone_Number,
    d.Address, d.JOIN_Date,
    d.Start_Date, d.End_Date, d.Is_Current
FROM customer_dim_scd2 d
LEFT JOIN customer_stage s ON d.CustomerID = s.CustomerID
WHERE d.Is_Current = '1'
  AND (s.CustomerID IS NULL
       OR (d.Email = s.Email AND d.Address = s.Address
           AND d.Phone_Number = s.Phone_Number AND d.Name = s.Name))

UNION ALL

-- PATH 3: Expire current records that HAVE changed
SELECT
    d.CustomerID, d.Name, d.Email, d.Phone_Number,
    d.Address, d.JOIN_Date,
    d.Start_Date,
    CAST(CURRENT_DATE AS STRING) AS End_Date,
    '0' AS Is_Current
FROM customer_dim_scd2 d
INNER JOIN customer_stage s ON d.CustomerID = s.CustomerID
WHERE d.Is_Current = '1'
  AND (d.Email != s.Email OR d.Address != s.Address
       OR d.Phone_Number != s.Phone_Number OR d.Name != s.Name)

UNION ALL

-- PATH 4: Insert new versions of changed records + brand new customers
SELECT
    s.CustomerID, s.Name, s.Email, s.Phone_Number,
    s.Address, s.JOIN_Date,
    CAST(CURRENT_DATE AS STRING) AS Start_Date,
    NULL AS End_Date,
    '1' AS Is_Current
FROM customer_stage s
LEFT JOIN customer_dim_scd2 d
    ON s.CustomerID = d.CustomerID AND d.Is_Current = '1'
WHERE d.CustomerID IS NULL
   OR d.Email != s.Email OR d.Address != s.Address
   OR d.Phone_Number != s.Phone_Number OR d.Name != s.Name;

-- ═══════════════════════════════════════════════════════════════
-- PART 5: FINAL VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Check record counts again
SELECT Is_Current, COUNT(*) FROM customer_dim_scd2 GROUP BY Is_Current;

-- Check a specific updated customer to see the history
-- (Assuming CustomerID 12364 exists in both sets with changes)
SELECT * FROM customer_dim_scd2 WHERE CustomerID = '12364' ORDER BY Start_Date;
