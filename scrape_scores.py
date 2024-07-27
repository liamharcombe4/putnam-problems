import requests
from bs4 import BeautifulSoup
import re
import json

archive_url = 'https://kskedlaya.org/putnam-archive/'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://www.google.com/',
}


def get_scores(year):
    url = f"{archive_url}putnam{year}stats.html"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    tables = soup.find_all('table')
    if len(tables) < 2:
        raise ValueError(f"Could not find the second table for year {year}")
    
    scores_table = tables[1]
    rows = scores_table.find_all('tr')
    scores = {}
    
    # Find the header, accounting for <th> and <td> tags
    header = rows[0].find_all(['td', 'th'])
    problems = []
    
    for ele in header[1:]:  # Skip the first column as it contains the scores
        problem = ele.text.strip()
        if problem.lower() == "total":
            continue
        # Convert problem number to the format LetterNumber (e.g., A-3 to A3)
        problem = re.sub(r'[^A-Za-z0-9]', '', problem)
        problems.append(problem)
    
    for problem in problems:
        scores[problem] = {}
    
    for row in rows[1:]:
        cols = row.find_all('td')
        score_value = cols[0].text.strip()
        if score_value.lower() in ['blank', 'n/a', 'na', '0']:
            score_value = 0
        else:
            score_value = int(score_value)
        
        for i, col in enumerate(cols[1:]):
            if header[i + 1].text.strip().lower() == "total":
                continue
            problem = problems[i]
            participants = int(col.text.strip())
            if score_value not in scores[problem]:
                scores[problem][score_value] = 0
            scores[problem][score_value] += participants
    
    return scores

def calculate_difficulty(scores):
    difficulty_scores = {}
    for problem, score_distribution in scores.items():
        max_score = max(score_distribution.keys())
        total_points_awarded = sum(participants * score for score, participants in score_distribution.items())
        total_possible_points = sum(participants * max_score for participants in score_distribution.values())  # Assuming each problem is out of 8 points
        difficulty_scores[problem] = total_points_awarded / total_possible_points if total_possible_points > 0 else 0
    return difficulty_scores

def normalize_score(difficulty_score, min_score, max_score):
    normalized_score = (difficulty_score - min_score) / (max_score - min_score) if max_score > min_score else 0
    star_rating = 5 - normalized_score * 4.5  # Scale to 0.5-5 stars
    return round(star_rating * 2) / 2  # Round to the nearest half-star


def update_json_with_ratings(problems, year, ratings, default_difficulty=None):
    year_str = str(year)
    for problem_key in problems[year_str].keys():
        problem_label = re.sub(r'[^A-Za-z0-9]', '', problem_key.replace("\\item[", "").replace("]", ""))
        if problem_label in ratings:
            difficulty = ratings[problem_label]
        elif default_difficulty and problem_label in default_difficulty:
            difficulty = default_difficulty[problem_label]
        else:
            difficulty = None
        
        problems[year_str][problem_key] = {
            'problem_text': problems[year_str][problem_key],
            'difficulty_rating': difficulty
        }


def main():
    years = range(1985, 2024)  # Process years from 1985 to 2023
    all_scores = {}
    min_score, max_score = float('inf'), float('-inf')

    default_difficulty = {
        'A1': 0.5, 'B1': 0.5,
        'A2': 1.5, 'B2': 1.5,
        'A3': 3.5, 'B3': 3.5,
        'A4': 4.0, 'B4': 4.0,
        'A5': 4.5, 'B5': 4.5,
        'A6': 5.0, 'B6': 5.0
    }

    for year in years:
        try:
            scores = get_scores(year)
            difficulty_scores = calculate_difficulty(scores)
            for problem, score in difficulty_scores.items():
                min_score = min(min_score, score)
                max_score = max(max_score, score)
            all_scores[year] = difficulty_scores
        except Exception as e:
            print(f"Skipping year {year} due to error: {e}")
            all_scores[year] = {}

    with open('putnam_problems.json', 'r') as f:
        putnam_problems = json.load(f)

    for year, difficulty_scores in all_scores.items():
        if difficulty_scores:
            ratings = {problem: normalize_score(score, min_score, max_score) for problem, score in difficulty_scores.items()}
            update_json_with_ratings(putnam_problems, year, ratings)
        else:
            # Use default difficulties for years with errors
            update_json_with_ratings(putnam_problems, year, {}, default_difficulty)

    with open('putnam_problems.json', 'w') as f:
        json.dump(putnam_problems, f, indent=4)

if __name__ == "__main__":
    main()