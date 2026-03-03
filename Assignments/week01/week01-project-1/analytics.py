def get_rankings(classroom):
    """Returns students sorted by average descending."""
    return sorted(classroom.students, key=lambda s: s.calculate_average(), reverse=True)

def get_stats(classroom):
    if not classroom.students:
        return None
    
    averages = [s.calculate_average() for s in classroom.students]
    return {
        "class_avg": sum(averages) / len(averages),
        "top_student": max(classroom.students, key=lambda s: s.calculate_average()).name,
        "lowest_student": min(classroom.students, key=lambda s: s.calculate_average()).name
    }