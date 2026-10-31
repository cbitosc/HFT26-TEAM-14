from typing import List, Dict

def get_role_recommendations(profile_skills: List[str]) -> List[Dict]:
    profile_lower = {s.lower() for s in profile_skills}

    role_profiles = {
        "AI Engineer": ["python", "llm", "ml", "sql", "pytorch", "rag"],
        "Backend Engineer": ["python", "sql", "api", "docker", "aws"],
        "Full Stack Engineer": ["javascript", "typescript", "react", "api", "sql"],
        "Data Scientist": ["python", "sql", "machine learning", "analytics", "pandas"],
        "Product Engineer": ["product strategy", "sql", "analytics", "python", "react"]
    }

    recommendations = []
    for role, required in role_profiles.items():
        overlap = len(profile_lower & set(required))
        score = round((overlap / max(len(required), 1)) * 100)
        if score >= 35:
            recommendations.append({
                "role": role,
                "fit_score": score
            })

    return sorted(recommendations, key=lambda x: x["fit_score"], reverse=True)[:4]
