from models import Student, Classroom
from utils import DataHandler
import analytics
import os

def main():
    # Use Class Method to initialize via the DataHandler utility
    raw_data = DataHandler.load_students('data.csv')
    classroom = Classroom.from_list(raw_data)

    while True:
        print("\n--- STUDENT SYSTEM ---")
        print("1. Add Student\n2. View Rankings\n3. Class Stats\n4. Exit")
        choice = input("Choice: ")
        os.system('cls' if os.name == 'nt' else 'clear')

        try:
            if choice == '1':
                sid = DataHandler.validate_id(input("ID: "))
                name = input("Name: ")
                s = Student(sid, name)
                
                grades_input = input("Enter grades (space separated): ")
                for g in grades_input.split():
                    s.add_grade(float(g))
                
                classroom.add_student(s)
                print("Student added successfully.")

            elif choice == '2':
                ranked = analytics.get_rankings(classroom)
                print(f"{'Rank':<5} | {'Name':<20} | {'Average':<10} | {'Grade':<5}")
                print("-" * 50)
                for i, s in enumerate(ranked, 1):
                    avg = s.calculate_average()
                    cat = Student.determine_category(avg) # Using Static Method
                    print(f"{i:<5} | {s.name:<20} | {avg:<10.1f}% | {cat:<5}")

            elif choice == '3':
                stats = analytics.get_stats(classroom)
                if stats:
                    print(f"Class Avg: {stats['class_avg']:.2f}")
                    print(f"Top Performer: {stats['top_student']}")

            elif choice == '4':
                DataHandler.save_students('data.csv', classroom.students)
                break
        
        except ValueError as e:
            print(f"Input Error: {e}")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()