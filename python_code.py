import uuid

from django.db import models


# ==============================
# COLLEGE
# ==============================
class College(models.Model):
    college_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    degree = models.CharField(max_length=100)
    branch = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'colleges'
        unique_together = [['name', 'degree', 'branch']]
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} - {self.degree} ({self.branch})"


# ==============================
# STUDENT
# ==============================
class Student(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    resume_url = models.TextField(null=True, blank=True)

    graduation_year = models.IntegerField(null=True, blank=True)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    college = models.ForeignKey(
        College,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        db_column='college_id'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['graduation_year']),
        ]

    def __str__(self):
        return self.full_name


# ==============================
# SCORE TYPES
# ==============================
class ScoreType(models.Model):
    score_type_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'score_types'

    def __str__(self):
        return self.display_name


# ==============================
# ASSESSMENT
# ==============================
class Assessment(models.Model):
    assessment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='assessments',
        db_column='student_id'
    )

    taken_at = models.CharField(max_length=50, null=True, blank=True)
    report_url = models.TextField(null=True, blank=True)

    org_assess_id = models.UUIDField(null=True, blank=True)
    total_student_score = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # NEW FIELDS
    attempt_end_reason = models.CharField(max_length=255, null=True, blank=True)
    proctor_details = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assessments'

    def __str__(self):
        return f"Assessment for {self.student.full_name}"


# ==============================
# ASSESSMENT SCORES
# ==============================
class AssessmentScore(models.Model):
    assessment_score_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='scores',
        db_column='assessment_id'
    )

    score_type = models.ForeignKey(
        ScoreType,
        on_delete=models.PROTECT,
        related_name='assessment_scores',
        db_column='score_type_id'
    )

    score = models.DecimalField(max_digits=10, decimal_places=2)
    max_score = models.DecimalField(max_digits=10, decimal_places=2)

    time_spent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    duration = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assessment_scores'
        unique_together = [['assessment', 'score_type']]

    def __str__(self):
        return f"{self.score_type.display_name}: {self.score}/{self.max_score}"


# ==============================
# INTERVIEWS
# ==============================
class Interview(models.Model):
    interview_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='interviews',
        db_column='student_id'
    )

    interview_date = models.CharField(max_length=50, null=True, blank=True)
    recording_url = models.TextField(null=True, blank=True)

    communication_rating = models.IntegerField(null=True, blank=True)
    core_cs_theory_rating = models.IntegerField(null=True, blank=True)
    dsa_theory_rating = models.IntegerField(null=True, blank=True)

    problem1_solving_rating = models.IntegerField(null=True, blank=True)
    problem1_code_implementation_rating = models.IntegerField(null=True, blank=True)
    problem2_solving_rating = models.IntegerField(null=True, blank=True)
    problem2_code_implementation_rating = models.IntegerField(null=True, blank=True)

    overall_interview_score_out_of_100 = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    notes = models.TextField(null=True, blank=True)
    audit_final_status = models.CharField(max_length=50, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'interviews'
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['interview_date']),
        ]

    def __str__(self):
        return f"Interview for {self.student.full_name}"

