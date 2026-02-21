import csv

class DataHandler:
    @staticmethod
    def validate_id(sid):
        if not sid.isalnum():
            raise ValueError("ID must be alphanumeric.")
        return sid

    @staticmethod
    def load_students(filename):
        from models import Student
        students = []
        try:
            with open(filename, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    grades = [float(g) for g in row['Grades'].split(',')] if row['Grades'] else []
                    students.append(Student(row['ID'], row['Name'], grades))
        except FileNotFoundError:
            print(f"Warning: {filename} not found. Starting with empty list.")
        except Exception as e:
            print(f"Error loading file: {e}")
        return students

    @staticmethod
    def save_students(filename, students):
        try:
            with open(filename, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["ID", "Name", "Grades"])
                for s in students:
                    writer.writerow([s.student_id, s.name, ",".join(map(str, s.grades))])
        except IOError as e:
            print(f"Critical Error saving data: {e}")