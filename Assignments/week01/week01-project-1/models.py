class Student:
    def __init__(self, student_id, name, grades=None):
        self.__student_id = student_id
        self.__name = name
        self.__grades = grades if grades else []

    @property
    def student_id(self): return self.__student_id

    @property
    def name(self): return self.__name

    @property
    def grades(self): return self.__grades

    def add_grade(self, grade):
        if 0 <= grade <= 100:
            self.__grades.append(grade)
        else:
            raise ValueError("Grade must be between 0 and 100.")

    def calculate_average(self):
        return sum(self.__grades) / len(self.__grades) if self.__grades else 0

    @staticmethod
    def determine_category(average):
        """Static method: Pure logic independent of a specific instance."""
        if average >= 90: return "A"
        if average >= 80: return "B"
        if average >= 70: return "C"
        if average >= 60: return "D"
        return "F"

class Classroom:
    def __init__(self, students=None):
        self.__students = students if students else []

    @property
    def students(self): return self.__students

    def add_student(self, student):
        if isinstance(student, Student):
            self.__students.append(student)

    @classmethod
    def from_list(cls, data_list):
        """Class method: Factory for creating a classroom from raw data."""
        classroom = cls()
        for item in data_list:
            # Assuming data_list contains Student objects or dicts to convert
            classroom.add_student(item)
        return classroom