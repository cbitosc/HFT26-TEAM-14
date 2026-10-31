from html import escape
from io import BytesIO

from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def _contact_line(profile: dict) -> str:
    return " | ".join(value for value in (profile.get("email", ""), profile.get("location", "")) if value)


def _missing_skills(analysis: dict) -> str:
    return ", ".join(item.get("skill", "") for item in analysis.get("missing_skills", [])[:5])


def export_resume_to_docx(profile: dict, analysis: dict, file_path: str):
    doc = Document()
    doc.add_heading(profile.get("name") or "Your Name", level=1)
    if profile.get("current_title"):
        doc.add_paragraph(profile["current_title"])
    contact = _contact_line(profile)
    if contact:
        doc.add_paragraph(contact)
    if profile.get("summary"):
        doc.add_heading("Professional Summary", level=2)
        doc.add_paragraph(profile["summary"])

    if profile.get("skills"):
        doc.add_heading("Skills", level=2)
        doc.add_paragraph(", ".join(profile["skills"]))

    if profile.get("experience"):
        doc.add_heading("Experience", level=2)
        for item in profile["experience"]:
            heading = " | ".join(value for value in (item.get("role", ""), item.get("company", ""), item.get("duration", "")) if value)
            if heading:
                doc.add_paragraph(heading)
            for bullet in item.get("bullets", []):
                if bullet.strip():
                    doc.add_paragraph(bullet, style="List Bullet")

    if profile.get("projects"):
        doc.add_heading("Projects", level=2)
        for project in profile["projects"]:
            if project.get("name"):
                doc.add_paragraph(project["name"], style="Heading 3")
            if project.get("description"):
                doc.add_paragraph(project["description"])
            if project.get("tech_stack"):
                doc.add_paragraph("Technologies: " + ", ".join(project["tech_stack"]))
            if project.get("impact"):
                doc.add_paragraph("Impact: " + project["impact"])

    if profile.get("education"):
        doc.add_heading("Education", level=2)
        for item in profile["education"]:
            line = " | ".join(value for value in (item.get("degree", ""), item.get("institution", ""), item.get("year", "")) if value)
            if line:
                doc.add_paragraph(line)

    if profile.get("certifications"):
        doc.add_heading("Certifications", level=2)
        for certification in profile["certifications"]:
            doc.add_paragraph(certification, style="List Bullet")

    doc.add_heading("Job Description Match", level=2)
    doc.add_paragraph(f"Match score: {analysis.get('match_score', 0)}%")
    gaps = _missing_skills(analysis)
    if gaps:
        doc.add_paragraph("Skills to develop: " + gaps)
    doc.save(file_path)


def export_resume_to_pdf(profile: dict, analysis: dict, file_path: str):
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=letter, title=f"{profile.get('name') or 'Resume'} Resume")
    styles = getSampleStyleSheet()
    story = []

    def paragraph(value, style="BodyText"):
        text = escape(str(value or ""))
        if text:
            story.append(Paragraph(text, styles[style]))

    def heading(value):
        story.append(Spacer(1, 10))
        paragraph(value, "Heading2")

    paragraph(profile.get("name") or "Your Name", "Title")
    paragraph(profile.get("current_title"), "Heading2")
    paragraph(_contact_line(profile))

    if profile.get("summary"):
        heading("Professional Summary")
        paragraph(profile["summary"])

    if profile.get("skills"):
        heading("Skills")
        paragraph(" | ".join(profile["skills"]))

    if profile.get("experience"):
        heading("Experience")
        for item in profile["experience"]:
            title = " | ".join(value for value in (item.get("role", ""), item.get("company", ""), item.get("duration", "")) if value)
            paragraph(title, "Heading3")
            for bullet in item.get("bullets", []):
                paragraph("- " + bullet)

    if profile.get("projects"):
        heading("Projects")
        for project in profile["projects"]:
            paragraph(project.get("name"), "Heading3")
            paragraph(project.get("description"))
            if project.get("tech_stack"):
                paragraph("Technologies: " + ", ".join(project["tech_stack"]))
            if project.get("impact"):
                paragraph("Impact: " + project["impact"])

    if profile.get("education"):
        heading("Education")
        for item in profile["education"]:
            paragraph(" | ".join(value for value in (item.get("degree", ""), item.get("institution", ""), item.get("year", "")) if value))

    if profile.get("certifications"):
        heading("Certifications")
        for certification in profile["certifications"]:
            paragraph("- " + certification)

    heading("Job Description Match")
    paragraph(f"Match score: {analysis.get('match_score', 0)}%")
    gaps = _missing_skills(analysis)
    if gaps:
        paragraph("Skills to develop: " + gaps)

    document.build(story)
    with open(file_path, "wb") as output:
        output.write(buffer.getvalue())
