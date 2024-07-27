import requests
from bs4 import BeautifulSoup
import re
import json

# Step 1: Scrape links to .tex files
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

session = requests.Session()
response = session.get(archive_url, headers=headers)
response.raise_for_status()  # Ensure we notice bad responses

soup = BeautifulSoup(response.text, 'html.parser')

# Locate the links to the .tex files
links = []
years = range(1985, 2024)
for year in years:
    link = f"{year}.tex"
    links.append(link)

print(f"Prepared to download {len(links)} .tex files.")

# Step 2: Download .tex files
def download_tex_file(url):
    response = session.get(url, headers=headers)
    response.raise_for_status()  # Ensure we notice bad responses
    return response.text

tex_files_content = {}
for link in links:
    tex_url = f'https://kskedlaya.org/putnam-archive/{link}'
    try:
        tex_content = download_tex_file(tex_url)
        year = re.search(r'\d{4}', link).group()
        tex_files_content[year] = tex_content
        print(f"Downloaded {link}")
    except requests.HTTPError as e:
        print(f"Failed to download {link}: {e}")

print(f"Downloaded {len(tex_files_content)} .tex files.")

# Step 3: Parse .tex files to extract problems
def normalize_problem_ids(tex_content):
    return re.sub(r'\\item\[(A|B)(\d+)\]', r'\\item[\1--\2]', tex_content)

def clean_problem_content(content):
    # Remove \end{document} and any trailing white spaces or unwanted lines
    content = re.sub(r'\\end\{document\}', '', content)
    return content.strip()

def extract_problems_from_tex(tex_content):
    problems = {}
    current_problem = None
    lines = tex_content.splitlines()

    for line in lines:
        problem_match = re.match(r'\\item\[(A|B)--\d\]', line)
        if problem_match:
            if current_problem:
                current_problem['content'] = clean_problem_content(current_problem['content'])
                problems[current_problem['id']] = current_problem['content']
            current_problem = {
                'id': problem_match.group(),
                'content': line + '\n'
            }
        elif current_problem:
            current_problem['content'] += line + '\n'

    if current_problem:
        current_problem['content'] = clean_problem_content(current_problem['content'])
        problems[current_problem['id']] = current_problem['content']

    return problems

all_problems = {}
for year, tex_content in tex_files_content.items():
    normalized_tex_content = normalize_problem_ids(tex_content)
    all_problems[year] = extract_problems_from_tex(normalized_tex_content)

# Step 4: Store problems in a JSON file
with open('putnam_problems.json', 'w') as json_file:
    json.dump(all_problems, json_file, indent=4)

print("Problems have been saved to putnam_problems.json")
