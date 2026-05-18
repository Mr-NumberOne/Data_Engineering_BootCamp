# 🐝 Hive Assignment — Complete Step-by-Step Guide

This guide walks you through **every step** of the assignment: spinning up the Docker cluster, connecting DBeaver, and executing all tasks with SQL.

---

## 🚀 Part 1: Docker Environment Setup

### 1.1 Prerequisites
- **Docker Desktop** installed and **running**
- **DBeaver** installed (Community Edition is fine)

### 1.2 Start the Cluster
Open a terminal in the `hive_assignment` folder and run:

```bash
docker-compose up -d
```

You should see **5 containers** starting:
| Container | Role |
|---|---|
| `hive-namenode` | HDFS NameNode (file system master) |
| `hive-datanode` | HDFS DataNode (file storage) |
| `hive-metastore-postgresql` | PostgreSQL backend for Hive metadata |
| `hive-metastore` | Hive Metastore service (Thrift) |
| `hive-server` | HiveServer2 (JDBC endpoint for DBeaver) |

### 1.3 Verify All Containers Are Running

```bash
docker ps
```

> [!IMPORTANT]
> **Wait ~90 seconds** after `docker-compose up -d` before connecting. The Metastore and HiveServer2 need time to initialize their Java services. You can monitor startup with: `docker logs -f hive-server`

---

## 🖥️ Part 2: Connecting DBeaver to Hive

### 2.1 Create a New Connection
1. Open **DBeaver**
2. Click **Database** → **New Database Connection** (or the plug icon ➕ in the toolbar)
3. In the search box, type **"Hive"** and select **Apache Hive**
4. Click **Next**

### 2.2 Connection Settings
Fill in the following:

| Field | Value |
|---|---|
| **Host** | `localhost` |
| **Port** | `10000` |
| **Database** | `default` |
| **Username** | *(leave empty or type `hive`)* |
| **Password** | *(leave empty)* |

### 2.3 Download the JDBC Driver
1. Click **"Edit Driver Settings"** (bottom-left of the connection dialog)
2. DBeaver will likely prompt you to **Download** missing driver files — click **Download**
3. Ensure the **Class Name** is: `org.apache.hive.jdbc.HiveDriver`
4. Click **OK** to return to the connection dialog

> [!TIP]
> If the auto-download fails, you can manually download the Hive JDBC driver from the Apache Hive site and add the JAR file in the driver settings.

### 2.4 Test the Connection
1. Click **"Test Connection..."**
2. You should see ✅ **"Connected"**
3. Click **Finish**

> [!WARNING]
> If you get `"Socket is closed by peer"`, the Hive server is still starting up. Wait another 30–60 seconds and try again.

### 2.5 Open a SQL Editor
1. Right-click your new Hive connection → **SQL Editor** → **Open SQL Script**
2. This is where you'll paste and execute all queries below — **one block at a time**

---

## 📋 Part 3: Assignment Tasks

### ✅ Task 1 — Create Internal & External Tables + Load Data

> **Goal**: Create an internal and an external customer table, load data, and observe the delimiter issue in the address column.

---

#### Step 1.1: Create the Database

```sql
CREATE DATABASE IF NOT EXISTS hive_db;
USE hive_db;
```

---

#### Step 1.2: Create the Internal Table (Standard Delimiter — Shows the Problem)

```sql
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
```

Load data:

```sql
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_int_broken;
```

Now query it to **see the problem**:

```sql
SELECT * FROM customer_int_broken LIMIT 10;
```

> [!NOTE]
> **The Problem**: Addresses like `"36923 Bowers Gateway Suite 027 New Kristi, MP 44312"` contain a comma. The standard `FIELDS TERMINATED BY ','` treats that comma as a column separator, breaking the address into multiple columns and shifting all subsequent values.

---

#### Step 1.3: Fix with OpenCSVSerde — Create Proper Internal Table

```sql
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
```

Load data:

```sql
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_int;
```

Verify it works:

```sql
SELECT * FROM customer_int LIMIT 10;
```

> ✅ **Now the address column reads correctly** — the OpenCSVSerde understands that commas inside quotes are part of the text, not field separators.

---

#### Step 1.4: Create the External Table with OpenCSVSerde

```sql
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
```

Load data:

```sql
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_ext;
```

Verify:

```sql
SELECT * FROM customer_ext LIMIT 10;
```

---

#### 🔑 OpenCSVSerde Properties Explained

| Property | Purpose |
|---|---|
| `separatorChar = ","` | The delimiter between columns (comma for CSV) |
| `quoteChar = "\""` | Text inside double-quotes is treated as a single value — commas inside are **ignored** |
| `escapeChar = "\\"` | The backslash lets you include special characters literally in the data |

---

### ✅ Task 2 — Drop Internal vs External Tables

> **Goal**: Observe what happens to the **data in HDFS** when you drop each table type.

---

#### Step 2.1: Check Tables Before Dropping

```sql
SHOW TABLES;
```

You should see: `customer_int`, `customer_int_broken`, `customer_ext`

---

#### Step 2.2: Drop the Internal Table

```sql
DROP TABLE IF EXISTS customer_int_broken;
DROP TABLE IF EXISTS customer_int;
```

**📌 What happens:**
- The table definition is removed from the Hive metastore ✅
- The actual data files in HDFS are **DELETED** ✅
- Data is **gone permanently** ❌

---

#### Step 2.3: Drop the External Table

```sql
DROP TABLE IF EXISTS customer_ext;
```

**📌 What happens:**
- The table definition is removed from the Hive metastore ✅
- The actual data files in HDFS are **NOT deleted** — they remain at `/user/hive/data/customer_external` ✅
- Data is **preserved** ✅

---

#### Step 2.4: Prove the External Data Survived

```sql
-- Re-create the external table pointing to the same HDFS location
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

-- Query it — the data is still there!
SELECT * FROM customer_ext LIMIT 10;
```

> [!TIP]
> **Conclusion**: External tables are safer for production data — dropping them only removes the schema, not the files. Internal tables are useful for temporary/staging data that should be cleaned up automatically.

---

### ✅ Task 3 — Create Customer SCD Type 2 Dimension

> **Goal**: Create a Slowly Changing Dimension (Type 2) table and load the mixed historical/current data from `customer_scd2_mixed.csv`.

---

#### Step 3.1: Recreate the Internal Table (for further tasks)

```sql
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
```

---

#### Step 3.2: Create the SCD Type 2 Dimension Table

```sql
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
```

---

#### Step 3.3: Load the Mixed SCD2 Data

```sql
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_scd2_mixed.csv'
OVERWRITE INTO TABLE customer_dim_scd2;
```

Verify the loaded data:

```sql
SELECT * FROM customer_dim_scd2 LIMIT 20;
```

Check the record count:

```sql
SELECT COUNT(*) FROM customer_dim_scd2;
SELECT Is_Current, COUNT(*) FROM customer_dim_scd2 GROUP BY Is_Current;
```

> [!NOTE]
> You should see **219 rows** — all with `Is_Current = 1`. These are the current snapshot records loaded from the mixed CSV.

---

### ✅ Task 4 — SCD Type 2 Merge (INSERT OVERWRITE + UNION ALL)

> **Goal**: Use `customer_updated.csv` to insert new records and expire changed records — **without using UPDATE/DELETE** (Hive doesn't support them on non-transactional tables).

---

#### Step 4.1: Create a Staging Table for the New Data

```sql
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
```

Load the updated data:

```sql
LOAD DATA LOCAL INPATH '/opt/workspace/data/customer_updated.csv'
OVERWRITE INTO TABLE customer_stage;
```

Verify:

```sql
SELECT * FROM customer_stage LIMIT 10;
```

---

#### Step 4.2: Execute the SCD Type 2 Merge

This single `INSERT OVERWRITE` replaces the entire dimension table using a **UNION ALL** of 4 logical paths:

```sql
INSERT OVERWRITE TABLE customer_dim_scd2

-- ═══════════════════════════════════════════════════════════════
-- PATH 1: Keep all historical records (Is_Current = 0)
-- These are already expired — preserve them as-is
-- ═══════════════════════════════════════════════════════════════
SELECT
    d.CustomerID, d.Name, d.Email, d.Phone_Number,
    d.Address, d.JOIN_Date,
    d.Start_Date, d.End_Date, d.Is_Current
FROM customer_dim_scd2 d
WHERE d.Is_Current = '0'

UNION ALL

-- ═══════════════════════════════════════════════════════════════
-- PATH 2: Keep current records that have NOT changed
-- (no matching row in staging, or data is identical)
-- ═══════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════
-- PATH 3: Expire current records that HAVE changed
-- Set End_Date = today and Is_Current = 0
-- ═══════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════
-- PATH 4: Insert new versions of changed records + brand new customers
-- Set Start_Date = today, End_Date = NULL, Is_Current = 1
-- ═══════════════════════════════════════════════════════════════
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
```

---

#### Step 4.3: Verify the SCD Type 2 Results

```sql
-- Check totals by Is_Current flag
SELECT Is_Current, COUNT(*) AS cnt
FROM customer_dim_scd2
GROUP BY Is_Current;
```

```sql
-- Look at a specific customer who was updated (e.g. CustomerID 12364)
SELECT * FROM customer_dim_scd2
WHERE CustomerID = '12364'
ORDER BY Start_Date;
```

**What you should see for updated customers:**
- An **expired record** (`Is_Current = 0`, `End_Date = today`) from PATH 3
- A **new current record** (`Is_Current = 1`, `End_Date = NULL`) from PATH 4

```sql
-- View some historical (expired) records
SELECT * FROM customer_dim_scd2
WHERE Is_Current = '0'
LIMIT 20;
```

---

#### 🔑 Why This Works Without UPDATE/DELETE

Hive's standard tables don't support `UPDATE` or `DELETE`. The workaround:

1. **Read** the entire existing dimension table
2. **Classify** each record into one of 4 categories using `UNION ALL`
3. **Write everything back** with `INSERT OVERWRITE`, completely replacing the table contents

This is the **Full Overwrite Pattern** — the standard approach for SCD Type 2 in Hive without transactional tables.

---

## 🧹 Part 4: Cleanup

When you're done, stop the cluster:

```bash
docker-compose down
```

To **completely reset** (delete all data and start fresh):

```bash
docker-compose down -v
```

---

## ❓ Troubleshooting

| Issue | Solution |
|---|---|
| `Socket is closed by peer` | Wait 60–90 seconds after `docker-compose up -d` for HiveServer2 to initialize |
| `MetaException: CDS indices` | Run `docker-compose down -v` then `docker-compose up -d` to reset the metastore |
| DBeaver can't find the Hive driver | Click **Edit Driver Settings** → **Download/Update** to fetch the JDBC JAR |
| `LOAD DATA` fails with file not found | Ensure the path starts with `/opt/workspace/data/` — this maps to your local `./data` folder |
| Container keeps restarting | Check logs with `docker logs hive-server` or `docker logs hive-metastore` |
