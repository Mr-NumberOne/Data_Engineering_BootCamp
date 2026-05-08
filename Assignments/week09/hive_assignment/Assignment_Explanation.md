# 📊 Hive SCD Type 2 Assignment: Intent & Learnings

This document outlines the educational objectives, the technical intent, and the core concepts mastered during the completion of this Hive data engineering assignment.

---

## 🎯 Assignment Intent

The primary goal of this assignment was to simulate a real-world Data Warehousing scenario using **Apache Hive**. In a modern data stack, tracking how data changes over time is critical for accurate reporting and auditing.

The assignment focused on three main pillars:
1.  **Infrastructure Mastery**: Deploying a complex, multi-container Big Data cluster using Docker.
2.  **Data Robustness**: Solving common data ingestion issues (like embedded delimiters) that break traditional ETL pipelines.
3.  **Historical Tracking**: Implementing **Slowly Changing Dimensions (SCD) Type 2**, which is the industry standard for maintaining a complete history of dimension changes.

---

## 🧠 Learned Concepts

### 1. Containerized Big Data Architecture
*   **Concept**: Orchestrating multiple services (`NameNode`, `DataNode`, `Postgres Metastore`, `HiveServer2`) to work as a unified cluster.
*   **Learning**: Understood the dependencies between the Hive Metastore and its relational database (Postgres), and how HiveServer2 acts as the gateway for external tools like DBeaver.

### 2. Advanced Data Parsing with SerDe
*   **Concept**: Using Serializer/Deserializer (SerDe) to interpret raw files.
*   **Learning**: Mastered the `OpenCSVSerde`. Traditional CSV parsing fails when fields (like `Address`) contain commas. By using `quoteChar` and `separatorChar`, we learned how to ingest "messy" real-world data without manually cleaning the source files.

### 3. Hive Table Management: Internal vs. External
*   **Concept**: The lifecycle of data in the Hadoop Distributed File System (HDFS).
*   **Learning**: 
    *   **Internal (Managed)**: Hive owns both the schema and the data. Dropping the table deletes the files.
    *   **External**: Hive only owns the schema. Dropping the table leaves the data files safe in HDFS. 
    *   *Takeaway*: Use External tables for production data to prevent accidental data loss.

### 4. Slowly Changing Dimensions (SCD) Type 2
*   **Concept**: Capturing the history of a record by never deleting data, but instead "expiring" old versions.
*   **Learning**: Implemented the SCD2 schema using `Start_Date`, `End_Date`, and `Is_Current` columns. This allows us to query the state of a customer at any point in history, not just their current state.

### 5. The "Full Overwrite" Pattern in Hive
*   **Concept**: Performing atomic updates in a system that doesn't support standard `UPDATE` or `DELETE` commands on flat files.
*   **Learning**: Mastered the `INSERT OVERWRITE ... SELECT ... UNION ALL` pattern. 
    *   We logically split the data into 4 paths: **Old History**, **Unchanged Records**, **Expired Records**, and **New/Updated Records**.
    *   By joining them with `UNION ALL`, we rebuild the entire table in one atomic operation.

### 6. Strict Type Enforcement in Hive
*   **Concept**: Schema validation in Big Data tools.
*   **Learning**: Encountered and resolved Hive's strict `UNION` rules (e.g., matching `STRING` vs `DATE`). Learned that even small type mismatches can break large-scale data merges, necessitating explicit `CAST` operations.

---

## ✅ Conclusion
By completing this assignment, we have moved beyond simple "Create/Load" operations into **Data Engineering Architecture**. We've built a pipeline that is resilient to data format issues, safe against accidental deletion, and capable of providing a full audit trail of every customer change.
