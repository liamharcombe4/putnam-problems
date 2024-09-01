import json

# The list of allowed tags
allowed_tags = {
    "Polynomials", "Number Theory", "Calculus", "Functional Equations", 
    "Inequalities", "Convergence", "Recursions", "Linear Algebra", 
    "Combinatorics", "Probability", "Geometry"
}

def process_putnam_problems(data):
    for year, problems in data.items():
        for problem_key, problem_details in problems.items():
            tags_and_strengths = problem_details.get("tags_and_strengths", {})

            # Filter the tags based on allowed_tags
            filtered_tags = {tag: strength for tag, strength in tags_and_strengths.items() if tag in allowed_tags}
            
            # Check if any tags remain after filtering
            if not filtered_tags:
                print(f"Problem {problem_key} in year {year} has no remaining tags after filtering.")
            else:
                # Check if all tags have a strength score less than 7
                if all(strength < 7 for strength in filtered_tags.values()):
                    print(f"Problem {problem_key} in year {year} has all tags with strength less than 7.")
            
            # Update the problem with the filtered tags
            problem_details["tags_and_strengths"] = filtered_tags

    return data

# # Load the JSON data
# with open('new_updated_putnam_problems.json', 'r') as file:
#     data = json.load(file)

# # Process the problems
# processed_data = process_putnam_problems(data)

# # Optionally save the modified data back to a JSON file
# with open('filtered_putnam_problems.json', 'w') as file:
#     json.dump(processed_data, file, indent=4)



def replace_algebra_with_abstract_algebra(data):
    """
    Replaces all occurrences of the 'Algebra' tag with 'Abstract Algebra' in the given data dictionary.
    
    Parameters:
    - data (dict): The dictionary containing the problem data.
    
    Returns:
    - dict: The modified dictionary with 'Algebra' replaced by 'Abstract Algebra'.
    """
    for year, problems in data.items():
        for problem_id, problem_info in problems.items():
            if 'tags_and_strengths' in problem_info:
                tags_and_strengths = problem_info['tags_and_strengths']
                if "Algebra" in tags_and_strengths:
                    tags_and_strengths["Abstract Algebra"] = tags_and_strengths.pop("Algebra")
                    print("Adding Abstract Algebra tag to", year, problem_id)
    return data


if __name__ == "__main__":
    # Assuming the JSON is loaded into a dictionary named 'putnam_problems'
    with open('filtered_putnam_problems.json', 'r') as file:
        putnam_problems = json.load(file)
    
    # Call the function to replace 'Algebra' with 'Abstract Algebra'
    updated_problems = replace_algebra_with_abstract_algebra(putnam_problems)
    
    # Optionally, save the updated dictionary back to a JSON file
    with open('latest_putnam_problems.json', 'w') as file:
        json.dump(updated_problems, file, indent=4)

    print("Algebra tags have been successfully replaced with Abstract Algebra.")