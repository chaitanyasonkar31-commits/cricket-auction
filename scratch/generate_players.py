import json
import os

# Curated list of real players with their country, role, and approximate prestige
# prestige: 'superstar' (90-99), 'star' (80-89), 'solid' (70-79), 'young' (60-69)
PLAYER_DEFINITIONS = [
    # India - Superstars & Core International
    {"name": "Virat Kohli", "country": "India", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "MS Dhoni", "country": "India", "role": "Wicket-Keeper", "tier": "superstar", "base": 20000000},
    {"name": "Jasprit Bumrah", "country": "India", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Rohit Sharma", "country": "India", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "Hardik Pandya", "country": "India", "role": "All-Rounder", "tier": "superstar", "base": 20000000},
    {"name": "Ravindra Jadeja", "country": "India", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Rishabh Pant", "country": "India", "role": "Wicket-Keeper", "tier": "superstar", "base": 20000000},
    {"name": "Suryakumar Yadav", "country": "India", "role": "Batsman", "tier": "superstar", "base": 15000000},
    {"name": "Shubman Gill", "country": "India", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Yashasvi Jaiswal", "country": "India", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "KL Rahul", "country": "India", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Shreyas Iyer", "country": "India", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "Sanju Samson", "country": "India", "role": "Wicket-Keeper", "tier": "star", "base": 15000000},
    {"name": "Mohammed Shami", "country": "India", "role": "Bowler", "tier": "star", "base": 15000000},
    {"name": "Mohammed Siraj", "country": "India", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Ravichandran Ashwin", "country": "India", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Axar Patel", "country": "India", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Kuldeep Yadav", "country": "India", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Yuzvendra Chahal", "country": "India", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Arshdeep Singh", "country": "India", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Ruturaj Gaikwad", "country": "India", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Abhishek Sharma", "country": "India", "role": "All-Rounder", "tier": "star", "base": 7500000},
    {"name": "Riyan Parag", "country": "India", "role": "All-Rounder", "tier": "star", "base": 7500000},
    
    # India - Established Stars / Solid IPL Performers
    {"name": "Ishan Kishan", "country": "India", "role": "Wicket-Keeper", "tier": "star", "base": 10000000},
    {"name": "Rinku Singh", "country": "India", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Shivam Dube", "country": "India", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Tilak Varma", "country": "India", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Deepak Chahar", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Shardul Thakur", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Bhuvneshwar Kumar", "country": "India", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "Washington Sundar", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Ravi Bishnoi", "country": "India", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "Avesh Khan", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Prasidh Krishna", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Khaleel Ahmed", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "T Natarajan", "country": "India", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "Sandeep Sharma", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Mohit Sharma", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Yash Dayal", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Harshit Rana", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Mayank Yadav", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Nitish Kumar Reddy", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Ramandeep Singh", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Angkrish Raghuvanshi", "country": "India", "role": "Batsman", "tier": "young", "base": 2000000},
    {"name": "Ayush Badoni", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Nehal Wadhera", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Abdul Samad", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Vijay Shankar", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Krunal Pandya", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Deepak Hooda", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Venkatesh Iyer", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Nitish Rana", "country": "India", "role": "Batsman", "tier": "solid", "base": 7500000},
    {"name": "Rahul Tewatia", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Shahrukh Khan", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Varun Chakaravarthy", "country": "India", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Sai Sudharsan", "country": "India", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Devdutt Padikkal", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Dhruv Jurel", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Jitesh Sharma", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Prithvi Shaw", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Mayank Agarwal", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Rahul Tripathi", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Ajinkya Rahane", "country": "India", "role": "Batsman", "tier": "solid", "base": 7500000},
    {"name": "Cheteshwar Pujara", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Umesh Yadav", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Ishant Sharma", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Wriddhiman Saha", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Shikhar Dhawan", "country": "India", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "Dinesh Karthik", "country": "India", "role": "Wicket-Keeper", "tier": "star", "base": 10000000},

    # India - Domestic, Young, Bench, Legends
    {"name": "Abhimanyu Easwaran", "country": "India", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Sarfaraz Khan", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Rajat Patidar", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Akash Deep", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Mukesh Kumar", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Rasikh Salam", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Vaibhav Arora", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Kartik Tyagi", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Kamlesh Nagarkoti", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Shivam Mavi", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Sandeep Warrier", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Jaydev Unadkat", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Siddarth Kaul", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Suyash Sharma", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Mayank Dagar", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Vijaykumar Vyshak", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Anukul Roy", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Harpreet Brar", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Prabhsimran Singh", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Atharva Taide", "country": "India", "role": "Batsman", "tier": "young", "base": 2000000},
    {"name": "Vidwath Kaverappa", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Ashutosh Sharma", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Shashank Singh", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Tanay Thyagarajan", "country": "India", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Sameer Rizvi", "country": "India", "role": "Batsman", "tier": "young", "base": 3000000},
    {"name": "Kumar Kushagra", "country": "India", "role": "Wicket-Keeper", "tier": "young", "base": 2000000},
    {"name": "Robin Minz", "country": "India", "role": "Wicket-Keeper", "tier": "young", "base": 2000000},
    {"name": "Swastik Chikara", "country": "India", "role": "Batsman", "tier": "young", "base": 2000000},
    {"name": "Sumit Kumar", "country": "India", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Vishnu Vinod", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Shams Mulani", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Shivalik Sharma", "country": "India", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Naman Dhir", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Saurabh Gopal", "country": "India", "role": "Wicket-Keeper", "tier": "young", "base": 2000000},
    {"name": "Anshul Kamboj", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Vicky Ostwal", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Lalit Yadav", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Pravin Dubey", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Abishek Porel", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Ricky Bhui", "country": "India", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Sakib Hussain", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Manish Pandey", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "M Siddharth", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Shreyas Gopal", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Arjun Tendulkar", "country": "India", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Akash Madhwal", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Kumar Kartikeya", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Piyush Chawla", "country": "India", "role": "Bowler", "tier": "star", "base": 5000000},
    {"name": "Krishnappa Gowtham", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Amit Mishra", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Karun Nair", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Manoj Tiwary", "country": "India", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Kedar Jadhav", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Robin Uthappa", "country": "India", "role": "Batsman", "tier": "star", "base": 5000000},
    {"name": "Suresh Raina", "country": "India", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Harbhajan Singh", "country": "India", "role": "Bowler", "tier": "star", "base": 7500000},
    {"name": "Yuvraj Singh", "country": "India", "role": "All-Rounder", "tier": "superstar", "base": 10000000},
    {"name": "Irfan Pathan", "country": "India", "role": "All-Rounder", "tier": "star", "base": 5000000},
    {"name": "Yusuf Pathan", "country": "India", "role": "All-Rounder", "tier": "star", "base": 5000000},
    {"name": "Pragyan Ojha", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Zaheer Khan", "country": "India", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Munaf Patel", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "RP Singh", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "S Sreesanth", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Ashish Nehra", "country": "India", "role": "Bowler", "tier": "star", "base": 7500000},
    {"name": "Murali Vijay", "country": "India", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Gautam Gambhir", "country": "India", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Parthiv Patel", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Ambati Rayudu", "country": "India", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Naman Ojha", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Saurabh Tiwary", "country": "India", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Abhishek Nayar", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Manpreet Gony", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Sreenath Aravind", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Praveen Kumar", "country": "India", "role": "Bowler", "tier": "star", "base": 5000000},
    {"name": "Vinay Kumar", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Manan Vohra", "country": "India", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Mandeep Singh", "country": "India", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Pawan Negi", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Stuart Binny", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Iqbal Abdulla", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Abu Nechim", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Karn Sharma", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Rishi Dhawan", "country": "India", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Barinder Sran", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Basil Thampi", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Ankit Rajpoot", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Murugan Ashwin", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Shahbaz Nadeem", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Sheldon Jackson", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Jagadeesan Narayan", "country": "India", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Ravisrinivasan Sai Kishore", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Simarjeet Singh", "country": "India", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Prashant Solanki", "country": "India", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Rajvardhan Hangargekar", "country": "India", "role": "Bowler", "tier": "young", "base": 3000000},
    {"name": "Mukesh Choudhary", "country": "India", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Tushar Deshpande", "country": "India", "role": "Bowler", "tier": "star", "base": 7500000},
    {"name": "Mayank Markande", "country": "India", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Umran Malik", "country": "India", "role": "Bowler", "tier": "star", "base": 5000000},
    {"name": "Priyam Garg", "country": "India", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Virat Singh", "country": "India", "role": "Batsman", "tier": "young", "base": 2000000},
    {"name": "Sachin Tendulkar", "country": "India", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "Sourav Ganguly", "country": "India", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Rahul Dravid", "country": "India", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "VVS Laxman", "country": "India", "role": "Batsman", "tier": "star", "base": 5000000},
    {"name": "Virender Sehwag", "country": "India", "role": "Batsman", "tier": "superstar", "base": 15000000},
    {"name": "Anil Kumble", "country": "India", "role": "Bowler", "tier": "superstar", "base": 10000000},
    
    # Australia - Overseas IPL stars
    {"name": "Mitchell Starc", "country": "Australia", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Pat Cummins", "country": "Australia", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Travis Head", "country": "Australia", "role": "Batsman", "tier": "superstar", "base": 15000000},
    {"name": "Glenn Maxwell", "country": "Australia", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Marcus Stoinis", "country": "Australia", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "Cameron Green", "country": "Australia", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "Tim David", "country": "Australia", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "David Warner", "country": "Australia", "role": "Batsman", "tier": "superstar", "base": 15000000},
    {"name": "Steven Smith", "country": "Australia", "role": "Batsman", "tier": "superstar", "base": 15000000},
    {"name": "Mitchell Marsh", "country": "Australia", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "Adam Zampa", "country": "Australia", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Josh Hazlewood", "country": "Australia", "role": "Bowler", "tier": "star", "base": 15000000},
    {"name": "Matthew Wade", "country": "Australia", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Alex Carey", "country": "Australia", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Nathan Lyon", "country": "Australia", "role": "Bowler", "tier": "star", "base": 5000000},
    {"name": "Sean Abbott", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Jason Behrendorff", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "Ashton Agar", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Chris Lynn", "country": "Australia", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Aaron Finch", "country": "Australia", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Shaun Marsh", "country": "Australia", "role": "Batsman", "tier": "star", "base": 5000000},
    {"name": "Kane Richardson", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Jhye Richardson", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Spencer Johnson", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 10000000},
    {"name": "Xavier Bartlett", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Jake Fraser-McGurk", "country": "Australia", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Cooper Connolly", "country": "Australia", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Nathan Ellis", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Ben Dwarshuis", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Daniel Sams", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Riley Meredith", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Peter Handscomb", "country": "Australia", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Marcus Harris", "country": "Australia", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Matt Short", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Josh Inglis", "country": "Australia", "role": "Wicket-Keeper", "tier": "star", "base": 7500000},
    {"name": "Aaron Hardie", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Hilton Cartwright", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Ashton Turner", "country": "Australia", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Mitchell Swepson", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Tanveer Sangha", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Lance Morris", "country": "Australia", "role": "Bowler", "tier": "young", "base": 3000000},
    {"name": "Joel Paris", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "D'Arcy Short", "country": "Australia", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Billy Stanlake", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Moises Henriques", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Gurinder Sandhu", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Andrew Tye", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Michael Neser", "country": "Australia", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Scott Boland", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Todd Murphy", "country": "Australia", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Shane Warne", "country": "Australia", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Adam Gilchrist", "country": "Australia", "role": "Wicket-Keeper", "tier": "superstar", "base": 20000000},
    {"name": "Glenn McGrath", "country": "Australia", "role": "Bowler", "tier": "superstar", "base": 15000000},
    {"name": "Brett Lee", "country": "Australia", "role": "Bowler", "tier": "superstar", "base": 10000000},
    {"name": "Matthew Hayden", "country": "Australia", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Ricky Ponting", "country": "Australia", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Michael Hussey", "country": "Australia", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Mitchell Johnson", "country": "Australia", "role": "Bowler", "tier": "star", "base": 10000000},

    # England - Overseas IPL stars
    {"name": "Jos Buttler", "country": "England", "role": "Wicket-Keeper", "tier": "superstar", "base": 20000000},
    {"name": "Jonny Bairstow", "country": "England", "role": "Wicket-Keeper", "tier": "star", "base": 15000000},
    {"name": "Liam Livingstone", "country": "England", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Sam Curran", "country": "England", "role": "All-Rounder", "tier": "star", "base": 20000000},
    {"name": "Harry Brook", "country": "England", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Ben Stokes", "country": "England", "role": "All-Rounder", "tier": "superstar", "base": 20000000},
    {"name": "Joe Root", "country": "England", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Phil Salt", "country": "England", "role": "Wicket-Keeper", "tier": "star", "base": 15000000},
    {"name": "Will Jacks", "country": "England", "role": "All-Rounder", "tier": "star", "base": 7500000},
    {"name": "Moeen Ali", "country": "England", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Chris Woakes", "country": "England", "role": "All-Rounder", "tier": "solid", "base": 10000000},
    {"name": "Mark Wood", "country": "England", "role": "Bowler", "tier": "star", "base": 15000000},
    {"name": "Jofra Archer", "country": "England", "role": "Bowler", "tier": "star", "base": 20000000},
    {"name": "Adil Rashid", "country": "England", "role": "Bowler", "tier": "star", "base": 7500000},
    {"name": "Rehan Ahmed", "country": "England", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Gus Atkinson", "country": "England", "role": "Bowler", "tier": "solid", "base": 10000000},
    {"name": "Tom Hartley", "country": "England", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Ollie Pope", "country": "England", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Zak Crawley", "country": "England", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Ben Duckett", "country": "England", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Dawid Malan", "country": "England", "role": "Batsman", "tier": "solid", "base": 7500000},
    {"name": "Alex Hales", "country": "England", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Jason Roy", "country": "England", "role": "Batsman", "tier": "solid", "base": 7500000},
    {"name": "Reece Topley", "country": "England", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "David Willey", "country": "England", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Luke Wood", "country": "England", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Brydon Carse", "country": "England", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Jamie Smith", "country": "England", "role": "Wicket-Keeper", "tier": "solid", "base": 7500000},
    {"name": "Shoaib Bashir", "country": "England", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Matthew Potts", "country": "England", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Dan Lawrence", "country": "England", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Chris Jordan", "country": "England", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Tymal Mills", "country": "England", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Richard Gleeson", "country": "England", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Saqib Mahmood", "country": "England", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Jamie Overton", "country": "England", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Sam Billings", "country": "England", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "James Vince", "country": "England", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Liam Dawson", "country": "England", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Tom Curran", "country": "England", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Jacob Bethell", "country": "England", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "John Turner", "country": "England", "role": "Bowler", "tier": "young", "base": 2000000},
    {"name": "Eoin Morgan", "country": "England", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Kevin Pietersen", "country": "England", "role": "Batsman", "tier": "superstar", "base": 10000000},
    {"name": "Andrew Flintoff", "country": "England", "role": "All-Rounder", "tier": "superstar", "base": 10000000},
    {"name": "James Anderson", "country": "England", "role": "Bowler", "tier": "superstar", "base": 7500000},
    {"name": "Stuart Broad", "country": "England", "role": "Bowler", "tier": "star", "base": 5000000},

    # South Africa - Overseas IPL stars
    {"name": "Heinrich Klaasen", "country": "South Africa", "role": "Wicket-Keeper", "tier": "superstar", "base": 20000000},
    {"name": "Quinton de Kock", "country": "South Africa", "role": "Wicket-Keeper", "tier": "star", "base": 15000000},
    {"name": "Aiden Markram", "country": "South Africa", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "David Miller", "country": "South Africa", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Kagiso Rabada", "country": "South Africa", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Anrich Nortje", "country": "South Africa", "role": "Bowler", "tier": "star", "base": 15000000},
    {"name": "Marco Jansen", "country": "South Africa", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "Keshav Maharaj", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "Gerald Coetzee", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 10000000},
    {"name": "Lungi Ngidi", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Tabraiz Shamsi", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Tristan Stubbs", "country": "South Africa", "role": "Wicket-Keeper", "tier": "star", "base": 15000000},
    {"name": "Dewald Brevis", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Temba Bavuma", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Reeza Hendricks", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Rassie van der Dussen", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Faf du Plessis", "country": "South Africa", "role": "Batsman", "tier": "star", "base": 15000000},
    {"name": "Hashim Amla", "country": "South Africa", "role": "Batsman", "tier": "star", "base": 5000000},
    {"name": "Dale Steyn", "country": "South Africa", "role": "Bowler", "tier": "superstar", "base": 10000000},
    {"name": "AB de Villiers", "country": "South Africa", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "Jacques Kallis", "country": "South Africa", "role": "All-Rounder", "tier": "superstar", "base": 20000000},
    {"name": "Ryan Rickelton", "country": "South Africa", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Nandre Burger", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Wiaan Mulder", "country": "South Africa", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Bjorn Fortuin", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Tony de Zorzi", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Matthew Breetzke", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Patrick Kruger", "country": "South Africa", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Ottneil Baartman", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Lizaad Williams", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Kwena Maphaka", "country": "South Africa", "role": "Bowler", "tier": "young", "base": 3000000},
    {"name": "Donovan Ferreira", "country": "South Africa", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Corbin Bosch", "country": "South Africa", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Wayne Parnell", "country": "South Africa", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Dwaine Pretorius", "country": "South Africa", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Rilee Rossouw", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 7500000},
    {"name": "Colin Ingram", "country": "South Africa", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Imran Tahir", "country": "South Africa", "role": "Bowler", "tier": "star", "base": 5000000},
    {"name": "David Wiese", "country": "South Africa", "role": "All-Rounder", "tier": "solid", "base": 2000000},

    # West Indies - Overseas IPL stars
    {"name": "Nicholas Pooran", "country": "West Indies", "role": "Wicket-Keeper", "tier": "superstar", "base": 20000000},
    {"name": "Andre Russell", "country": "West Indies", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Sunil Narine", "country": "West Indies", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Kieron Pollard", "country": "West Indies", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Dwayne Bravo", "country": "West Indies", "role": "All-Rounder", "tier": "superstar", "base": 10000000},
    {"name": "Chris Gayle", "country": "West Indies", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "Jason Holder", "country": "West Indies", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Rovman Powell", "country": "West Indies", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "Shai Hope", "country": "West Indies", "role": "Wicket-Keeper", "tier": "solid", "base": 7500000},
    {"name": "Brandon King", "country": "West Indies", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Kyle Mayers", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Alzarri Joseph", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 10000000},
    {"name": "Shimron Hetmyer", "country": "West Indies", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "Sherfane Rutherford", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Romario Shepherd", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Akeal Hosein", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Gudakesh Motie", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Shamar Joseph", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 15000000},
    {"name": "Roston Chase", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Johnson Charles", "country": "West Indies", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Evin Lewis", "country": "West Indies", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Lendl Simmons", "country": "West Indies", "role": "Batsman", "tier": "star", "base": 3000000},
    {"name": "Darren Bravo", "country": "West Indies", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Marlon Samuels", "country": "West Indies", "role": "Batsman", "tier": "star", "base": 3000000},
    {"name": "Denesh Ramdin", "country": "West Indies", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Carlos Brathwaite", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Sheldon Cottrell", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Oshane Thomas", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Obed McCoy", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Hayden Walsh Jr", "country": "West Indies", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Matthew Forde", "country": "West Indies", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Dominic Drakes", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Fabian Allen", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Odean Smith", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Keemo Paul", "country": "West Indies", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Darren Sammy", "country": "West Indies", "role": "All-Rounder", "tier": "star", "base": 3000000},
    {"name": "Viv Richards", "country": "West Indies", "role": "Batsman", "tier": "superstar", "base": 20000000},

    # New Zealand - Overseas IPL stars
    {"name": "Kane Williamson", "country": "New Zealand", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "Devon Conway", "country": "New Zealand", "role": "Wicket-Keeper", "tier": "star", "base": 15000000},
    {"name": "Rachin Ravindra", "country": "New Zealand", "role": "All-Rounder", "tier": "star", "base": 15000000},
    {"name": "Daryl Mitchell", "country": "New Zealand", "role": "All-Rounder", "tier": "star", "base": 20000000},
    {"name": "Glenn Phillips", "country": "New Zealand", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "Mitchell Santner", "country": "New Zealand", "role": "All-Rounder", "tier": "star", "base": 7500000},
    {"name": "Trent Boult", "country": "New Zealand", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Tim Southee", "country": "New Zealand", "role": "Bowler", "tier": "star", "base": 15000000},
    {"name": "Matt Henry", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 10000000},
    {"name": "Lockie Ferguson", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 10000000},
    {"name": "Ish Sodhi", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Finn Allen", "country": "New Zealand", "role": "Batsman", "tier": "solid", "base": 7500000},
    {"name": "Tom Latham", "country": "New Zealand", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Michael Bracewell", "country": "New Zealand", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Mark Chapman", "country": "New Zealand", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Henry Nicholls", "country": "New Zealand", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Colin Munro", "country": "New Zealand", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Martin Guptill", "country": "New Zealand", "role": "Batsman", "tier": "star", "base": 5000000},
    {"name": "James Neesham", "country": "New Zealand", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Adam Milne", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Will Young", "country": "New Zealand", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Kyle Jamieson", "country": "New Zealand", "role": "All-Rounder", "tier": "solid", "base": 10000000},
    {"name": "Ben Sears", "country": "New Zealand", "role": "Bowler", "tier": "young", "base": 3000000},
    {"name": "William O'Rourke", "country": "New Zealand", "role": "Bowler", "tier": "young", "base": 5000000},
    {"name": "Jacob Duffy", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Blair Tickner", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Ajaz Patel", "country": "New Zealand", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Tom Blundell", "country": "New Zealand", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Josh Clarkson", "country": "New Zealand", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Tim Seifert", "country": "New Zealand", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Daniel Vettori", "country": "New Zealand", "role": "All-Rounder", "tier": "superstar", "base": 10000000},
    {"name": "Brendon McCullum", "country": "New Zealand", "role": "Batsman", "tier": "superstar", "base": 15000000},

    # Afghanistan - Overseas IPL stars
    {"name": "Rashid Khan", "country": "Afghanistan", "role": "Bowler", "tier": "superstar", "base": 15000000},
    {"name": "Mohammad Nabi", "country": "Afghanistan", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Rahmanullah Gurbaz", "country": "Afghanistan", "role": "Wicket-Keeper", "tier": "star", "base": 10000000},
    {"name": "Ibrahim Zadran", "country": "Afghanistan", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Fazalhaq Farooqi", "country": "Afghanistan", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Mujeeb Ur Rahman", "country": "Afghanistan", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Naveen-ul-Haq", "country": "Afghanistan", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Azmatullah Omarzai", "country": "Afghanistan", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Najibullah Zadran", "country": "Afghanistan", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Hazratullah Zazai", "country": "Afghanistan", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Gulbadin Naib", "country": "Afghanistan", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Mohammad Shahzad", "country": "Afghanistan", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Karim Janat", "country": "Afghanistan", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Noor Ahmad", "country": "Afghanistan", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Qais Ahmad", "country": "Afghanistan", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Fareed Ahmad", "country": "Afghanistan", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Sharafuddin Ashraf", "country": "Afghanistan", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Rahmat Shah", "country": "Afghanistan", "role": "Batsman", "tier": "solid", "base": 2000000},
    {"name": "Hashmatullah Shahidi", "country": "Afghanistan", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Ikram Alikhil", "country": "Afghanistan", "role": "Wicket-Keeper", "tier": "solid", "base": 2000000},
    {"name": "Nangeyalia Kharote", "country": "Afghanistan", "role": "All-Rounder", "tier": "young", "base": 2000000},
    {"name": "Allah Ghazanfar", "country": "Afghanistan", "role": "Bowler", "tier": "young", "base": 3000000},

    # Sri Lanka - Overseas IPL stars
    {"name": "Wanindu Hasaranga", "country": "Sri Lanka", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Charith Asalanka", "country": "Sri Lanka", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "Pathum Nissanka", "country": "Sri Lanka", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Kusal Mendis", "country": "Sri Lanka", "role": "Wicket-Keeper", "tier": "star", "base": 7500000},
    {"name": "Sadeera Samarawickrama", "country": "Sri Lanka", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Maheesh Theekshana", "country": "Sri Lanka", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Matheesha Pathirana", "country": "Sri Lanka", "role": "Bowler", "tier": "superstar", "base": 15000000},
    {"name": "Dilshan Madushanka", "country": "Sri Lanka", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Dushmantha Chameera", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Lahiru Kumara", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Nuwan Thushara", "country": "Sri Lanka", "role": "Bowler", "tier": "star", "base": 7500000},
    {"name": "Dunith Wellalage", "country": "Sri Lanka", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Kamindu Mendis", "country": "Sri Lanka", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Bhanuka Rajapaksa", "country": "Sri Lanka", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Dasun Shanaka", "country": "Sri Lanka", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Angelo Mathews", "country": "Sri Lanka", "role": "All-Rounder", "tier": "star", "base": 7500000},
    {"name": "Dinesh Chandimal", "country": "Sri Lanka", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Kusal Perera", "country": "Sri Lanka", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Avishka Fernando", "country": "Sri Lanka", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Dhananjaya de Silva", "country": "Sri Lanka", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Jeffrey Vandersay", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Akila Dananjaya", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Kasun Rajitha", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Asitha Fernando", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 2000000},
    {"name": "Vijayakanth Viyaskanth", "country": "Sri Lanka", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Muralitharan", "country": "Sri Lanka", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Lasith Malinga", "country": "Sri Lanka", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Kumar Sangakkara", "country": "Sri Lanka", "role": "Wicket-Keeper", "tier": "superstar", "base": 15000000},
    {"name": "Mahela Jayawardene", "country": "Sri Lanka", "role": "Batsman", "tier": "superstar", "base": 10000000},

    # Pakistan - Overseas IPL/Legends
    {"name": "Babar Azam", "country": "Pakistan", "role": "Batsman", "tier": "superstar", "base": 20000000},
    {"name": "Shaheen Afridi", "country": "Pakistan", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Mohammad Rizwan", "country": "Pakistan", "role": "Wicket-Keeper", "tier": "superstar", "base": 15000000},
    {"name": "Shadab Khan", "country": "Pakistan", "role": "All-Rounder", "tier": "star", "base": 10000000},
    {"name": "Haris Rauf", "country": "Pakistan", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Naseem Shah", "country": "Pakistan", "role": "Bowler", "tier": "star", "base": 15000000},
    {"name": "Fakhar Zaman", "country": "Pakistan", "role": "Batsman", "tier": "star", "base": 10000000},
    {"name": "Iftikhar Ahmed", "country": "Pakistan", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Mohammad Amir", "country": "Pakistan", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Imad Wasim", "country": "Pakistan", "role": "All-Rounder", "tier": "solid", "base": 7500000},
    {"name": "Saim Ayub", "country": "Pakistan", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Azam Khan", "country": "Pakistan", "role": "Wicket-Keeper", "tier": "solid", "base": 3000000},
    {"name": "Usman Khan", "country": "Pakistan", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Abrar Ahmed", "country": "Pakistan", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Zaman Khan", "country": "Pakistan", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Saud Shakeel", "country": "Pakistan", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Abdullah Shafique", "country": "Pakistan", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Mohammad Wasim Jr", "country": "Pakistan", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Hasan Ali", "country": "Pakistan", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Faheem Ashraf", "country": "Pakistan", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Shan Masood", "country": "Pakistan", "role": "Batsman", "tier": "solid", "base": 3000000},
    {"name": "Mohammad Nawaz", "country": "Pakistan", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Salman Ali Agha", "country": "Pakistan", "role": "All-Rounder", "tier": "solid", "base": 3000000},
    {"name": "Wasim Akram", "country": "Pakistan", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Waqar Younis", "country": "Pakistan", "role": "Bowler", "tier": "superstar", "base": 15000000},
    {"name": "Shoaib Akhtar", "country": "Pakistan", "role": "Bowler", "tier": "superstar", "base": 20000000},
    {"name": "Shahid Afridi", "country": "Pakistan", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Saeed Ajmal", "country": "Pakistan", "role": "Bowler", "tier": "star", "base": 5000000},

    # Bangladesh - Overseas IPL stars
    {"name": "Shakib Al Hasan", "country": "Bangladesh", "role": "All-Rounder", "tier": "superstar", "base": 15000000},
    {"name": "Mustafizur Rahman", "country": "Bangladesh", "role": "Bowler", "tier": "star", "base": 10000000},
    {"name": "Litton Das", "country": "Bangladesh", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Najmul Hossain Shanto", "country": "Bangladesh", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Towhid Hridoy", "country": "Bangladesh", "role": "Batsman", "tier": "solid", "base": 5000000},
    {"name": "Taskin Ahmed", "country": "Bangladesh", "role": "Bowler", "tier": "solid", "base": 7500000},
    {"name": "Shoriful Islam", "country": "Bangladesh", "role": "Bowler", "tier": "solid", "base": 5000000},
    {"name": "Hasan Mahmud", "country": "Bangladesh", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Tanzim Hasan Sakib", "country": "Bangladesh", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Soumya Sarkar", "country": "Bangladesh", "role": "All-Rounder", "tier": "solid", "base": 2000000},
    {"name": "Mahmudullah", "country": "Bangladesh", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Mushfiqur Rahim", "country": "Bangladesh", "role": "Wicket-Keeper", "tier": "solid", "base": 5000000},
    {"name": "Tamim Iqbal", "country": "Bangladesh", "role": "Batsman", "tier": "star", "base": 7500000},
    {"name": "Mehidy Hasan Miraz", "country": "Bangladesh", "role": "All-Rounder", "tier": "solid", "base": 5000000},
    {"name": "Rishad Hossain", "country": "Bangladesh", "role": "Bowler", "tier": "solid", "base": 3000000},
    {"name": "Tanzid Hasan", "country": "Bangladesh", "role": "Batsman", "tier": "young", "base": 2000000},
]

# Complete the list to reach 515 players by dynamically generating remaining players with a set of real player names
# from international/domestic pools who have played cricket in the IPL or internationally
ADDITIONAL_REAL_PLAYER_NAMES = [
    # More Indian Domestic/IPL
    ("Rinku Singh", "India", "Batsman", "star", 7500000),
    ("Ashutosh Sharma", "India", "Batsman", "solid", 3000000),
    ("Shashank Singh", "India", "Batsman", "solid", 3000000),
    ("Sameer Rizvi", "India", "Batsman", "young", 3000000),
    ("Robin Minz", "India", "Wicket-Keeper", "young", 2000000),
    ("Swastik Chikara", "India", "Batsman", "young", 2000000),
    ("Sumit Kumar", "India", "All-Rounder", "young", 2000000),
    ("Naman Dhir", "India", "All-Rounder", "solid", 3000000),
    ("Anshul Kamboj", "India", "Bowler", "young", 2000000),
    ("Manimaran Siddharth", "India", "Bowler", "solid", 2000000),
    ("Angkrish Raghuvanshi", "India", "Batsman", "young", 2000000),
    ("Saurabh Gopal", "India", "Wicket-Keeper", "young", 2000000),
    ("Rasikh Salam", "India", "Bowler", "young", 2000000),
    ("Yash Dayal", "India", "Bowler", "solid", 5000000),
    ("Harshit Rana", "India", "Bowler", "solid", 5000000),
    ("Mayank Yadav", "India", "Bowler", "solid", 5000000),
    ("Ramandeep Singh", "India", "All-Rounder", "solid", 3000000),
    ("Nitish Kumar Reddy", "India", "All-Rounder", "solid", 5000000),
    ("Devdutt Padikkal", "India", "Batsman", "solid", 5000000),
    ("Sai Sudharsan", "India", "Batsman", "star", 7500000),
    ("Dhruv Jurel", "India", "Wicket-Keeper", "solid", 5000000),
    ("Jitesh Sharma", "India", "Wicket-Keeper", "solid", 5000000),
    ("Shahrukh Khan", "India", "All-Rounder", "solid", 3000000),
    ("Rahul Tewatia", "India", "All-Rounder", "solid", 5000000),
    ("Vijay Shankar", "India", "All-Rounder", "solid", 3000000),
    ("Krunal Pandya", "India", "All-Rounder", "solid", 7500000),
    ("Deepak Hooda", "India", "All-Rounder", "solid", 5000000),
    ("Venkatesh Iyer", "India", "All-Rounder", "solid", 7500000),
    ("Prithvi Shaw", "India", "Batsman", "solid", 5000000),
    ("Abishek Porel", "India", "Wicket-Keeper", "solid", 3000000),
    ("Ricky Bhui", "India", "Batsman", "solid", 2000000),
    ("Lalit Yadav", "India", "All-Rounder", "solid", 3000000),
    ("Pravin Dubey", "India", "Bowler", "solid", 2000000),
    ("Vicky Ostwal", "India", "Bowler", "young", 2000000),
    ("Akash Deep", "India", "Bowler", "solid", 3000000),
    ("Sarfaraz Khan", "India", "Batsman", "solid", 5000000),
    ("Rajat Patidar", "India", "Batsman", "solid", 5000000),
    ("Kumar Kushagra", "India", "Wicket-Keeper", "young", 2000000),
    ("Shams Mulani", "India", "All-Rounder", "solid", 2000000),
    ("Shivalik Sharma", "India", "All-Rounder", "young", 2000000),
    ("Sakib Hussain", "India", "Bowler", "young", 2000000),
    ("Arjun Tendulkar", "India", "All-Rounder", "young", 2000000),
    ("Akash Madhwal", "India", "Bowler", "solid", 5000000),
    ("Kumar Kartikeya", "India", "Bowler", "solid", 2000000),
    ("Vishnu Vinod", "India", "Wicket-Keeper", "solid", 2000000),
    ("Harpreet Brar", "India", "Bowler", "solid", 3000000),
    ("Vidwath Kaverappa", "India", "Bowler", "young", 2000000),
    ("Vijaykumar Vyshak", "India", "Bowler", "solid", 3000000),
    ("Anukul Roy", "India", "All-Rounder", "solid", 2000000),
    ("Suyash Sharma", "India", "Bowler", "solid", 3000000),
    ("Mayank Dagar", "India", "All-Rounder", "solid", 3000000),
    ("M Siddharth", "India", "Bowler", "solid", 2000000),
    ("Shreyas Gopal", "India", "Bowler", "solid", 3000000),
    ("Karn Sharma", "India", "Bowler", "solid", 3000000),
    ("Rishi Dhawan", "India", "All-Rounder", "solid", 3000000),
    ("Barinder Sran", "India", "Bowler", "solid", 2000000),
    ("Basil Thampi", "India", "Bowler", "solid", 2000000),
    ("Ankit Rajpoot", "India", "Bowler", "solid", 2000000),
    ("Murugan Ashwin", "India", "Bowler", "solid", 2000000),
    ("Shahbaz Nadeem", "India", "Bowler", "solid", 2000000),
    ("Sheldon Jackson", "India", "Wicket-Keeper", "solid", 2000000),
    ("Jagadeesan Narayan", "India", "Wicket-Keeper", "solid", 3000000),
    ("Ravisrinivasan Sai Kishore", "India", "Bowler", "solid", 3000000),
    ("Simarjeet Singh", "India", "Bowler", "solid", 2000000),
    ("Prashant Solanki", "India", "Bowler", "young", 2000000),
    ("Rajvardhan Hangargekar", "India", "Bowler", "young", 3000000),
    ("Mukesh Choudhary", "India", "Bowler", "solid", 3000000),
    ("Tushar Deshpande", "India", "Bowler", "star", 7500000),
    ("Mayank Markande", "India", "Bowler", "solid", 5000000),
    ("Umran Malik", "India", "Bowler", "star", 5000000),
    ("Priyam Garg", "India", "Batsman", "solid", 2000000),
    ("Virat Singh", "India", "Batsman", "young", 2000000),
    
    # Famous retired IPL/Indian Domestic or other International Players (to hit 500+)
    ("Zaheer Khan", "India", "Bowler", "star", 10000000),
    ("Harbhajan Singh", "India", "Bowler", "star", 7500000),
    ("Suresh Raina", "India", "Batsman", "superstar", 10000000),
    ("Yuvraj Singh", "India", "All-Rounder", "superstar", 10000000),
    ("Gautam Gambhir", "India", "Batsman", "superstar", 10000000),
    ("Robin Uthappa", "India", "Batsman", "star", 5000000),
    ("Ambati Rayudu", "India", "Batsman", "star", 7500000),
    ("Yusuf Pathan", "India", "All-Rounder", "star", 5000000),
    ("Irfan Pathan", "India", "All-Rounder", "star", 5000000),
    ("Pragyan Ojha", "India", "Bowler", "solid", 3000000),
    ("Munaf Patel", "India", "Bowler", "solid", 3000000),
    ("RP Singh", "India", "Bowler", "solid", 3000000),
    ("S Sreesanth", "India", "Bowler", "solid", 3000000),
    ("Ashish Nehra", "India", "Bowler", "star", 7500000),
    ("Murali Vijay", "India", "Batsman", "solid", 5000000),
    ("Parthiv Patel", "India", "Wicket-Keeper", "solid", 3000000),
    ("Naman Ojha", "India", "Wicket-Keeper", "solid", 2000000),
    ("Saurabh Tiwary", "India", "Batsman", "solid", 2000000),
    ("Abhishek Nayar", "India", "All-Rounder", "solid", 2000000),
    ("Manpreet Gony", "India", "Bowler", "solid", 2000000),
    ("Sreenath Aravind", "India", "Bowler", "solid", 2000000),
    ("Praveen Kumar", "India", "Bowler", "star", 5000000),
    ("Vinay Kumar", "India", "Bowler", "solid", 3000000),
    ("Manan Vohra", "India", "Batsman", "solid", 2000000),
    ("Mandeep Singh", "India", "Batsman", "solid", 3000000),
    ("Pawan Negi", "India", "All-Rounder", "solid", 2000000),
    ("Stuart Binny", "India", "All-Rounder", "solid", 2000000),
    ("Iqbal Abdulla", "India", "All-Rounder", "solid", 2000000),
    ("Abu Nechim", "India", "Bowler", "solid", 2000000),
    
    # International / Rest of World IPL Players
    ("Jake Fraser-McGurk", "Australia", "Batsman", "star", 15000000),
    ("Spencer Johnson", "Australia", "Bowler", "solid", 10000000),
    ("Josh Inglis", "Australia", "Wicket-Keeper", "star", 7500000),
    ("Matt Short", "Australia", "All-Rounder", "solid", 5000000),
    ("Aaron Hardie", "Australia", "All-Rounder", "solid", 5000000),
    ("Lance Morris", "Australia", "Bowler", "young", 3000000),
    ("Xavier Bartlett", "Australia", "Bowler", "solid", 5000000),
    ("Nathan Ellis", "Australia", "Bowler", "solid", 5000000),
    ("Cooper Connolly", "Australia", "All-Rounder", "young", 2000000),
    ("Riley Meredith", "Australia", "Bowler", "solid", 3000000),
    ("Daniel Sams", "Australia", "All-Rounder", "solid", 3000000),
    ("Tim David", "Australia", "Batsman", "star", 10000000),
    ("Dewald Brevis", "South Africa", "Batsman", "solid", 5000000),
    ("Tristan Stubbs", "South Africa", "Wicket-Keeper", "star", 15000000),
    ("Nandre Burger", "South Africa", "Bowler", "solid", 5000000),
    ("Gerald Coetzee", "South Africa", "Bowler", "solid", 10000000),
    ("Donovan Ferreira", "South Africa", "All-Rounder", "solid", 2000000),
    ("Kwena Maphaka", "South Africa", "Bowler", "young", 3000000),
    ("Ryan Rickelton", "South Africa", "Wicket-Keeper", "solid", 3000000),
    ("Ottneil Baartman", "South Africa", "Bowler", "solid", 5000000),
    ("Lizaad Williams", "South Africa", "Bowler", "solid", 2000000),
    ("Patrick Kruger", "South Africa", "All-Rounder", "young", 2000000),
    ("Tony de Zorzi", "South Africa", "Batsman", "solid", 3000000),
    ("Wiaan Mulder", "South Africa", "All-Rounder", "solid", 3000000),
    ("Naveen-ul-Haq", "Afghanistan", "Bowler", "star", 10000000),
    ("Azmatullah Omarzai", "Afghanistan", "All-Rounder", "star", 10000000),
    ("Noor Ahmad", "Afghanistan", "Bowler", "star", 10000000),
    ("Allah Ghazanfar", "Afghanistan", "Bowler", "young", 3000000),
    ("Rahmanullah Gurbaz", "Afghanistan", "Wicket-Keeper", "star", 10000000),
    ("Fazalhaq Farooqi", "Afghanistan", "Bowler", "star", 10000000),
    ("Ibrahim Zadran", "Afghanistan", "Batsman", "star", 7500000),
    ("Mujeeb Ur Rahman", "Afghanistan", "Bowler", "star", 10000000),
    ("Matheesha Pathirana", "Sri Lanka", "Bowler", "superstar", 15000000),
    ("Maheesh Theekshana", "Sri Lanka", "Bowler", "star", 10000000),
    ("Dilshan Madushanka", "Sri Lanka", "Bowler", "star", 10000000),
    ("Nuwan Thushara", "Sri Lanka", "Bowler", "star", 7500000),
    ("Dunith Wellalage", "Sri Lanka", "All-Rounder", "solid", 5000000),
    ("Kamindu Mendis", "Sri Lanka", "All-Rounder", "star", 10000000),
    ("Vijayakanth Viyaskanth", "Sri Lanka", "Bowler", "solid", 3000000),
    ("Wanindu Hasaranga", "Sri Lanka", "All-Rounder", "superstar", 15000000),
    ("Phil Salt", "England", "Wicket-Keeper", "star", 15000000),
    ("Will Jacks", "England", "All-Rounder", "star", 7500000),
    ("Gus Atkinson", "England", "Bowler", "solid", 10000000),
    ("Tom Hartley", "England", "Bowler", "solid", 5000000),
    ("Jamie Smith", "England", "Wicket-Keeper", "solid", 7500000),
    ("Jacob Bethell", "England", "All-Rounder", "young", 2000000),
    ("Reece Topley", "England", "Bowler", "solid", 7500000),
    ("Luke Wood", "England", "Bowler", "solid", 5000000),
    ("Brydon Carse", "England", "Bowler", "solid", 5000000),
    ("Rachin Ravindra", "New Zealand", "All-Rounder", "star", 15000000),
    ("Devon Conway", "New Zealand", "Wicket-Keeper", "star", 15000000),
    ("Daryl Mitchell", "New Zealand", "All-Rounder", "star", 20000000),
    ("Mitchell Santner", "New Zealand", "All-Rounder", "star", 7500000),
    ("Trent Boult", "New Zealand", "Bowler", "superstar", 20000000),
    ("Lockie Ferguson", "New Zealand", "Bowler", "solid", 10000000),
    ("Finn Allen", "New Zealand", "Batsman", "solid", 7500000),
    ("Matt Henry", "New Zealand", "Bowler", "solid", 10000000),
    ("William O'Rourke", "New Zealand", "Bowler", "young", 5000000),
    ("Ben Sears", "New Zealand", "Bowler", "young", 3000000),
    ("Shamar Joseph", "West Indies", "Bowler", "solid", 15000000),
    ("Alzarri Joseph", "West Indies", "Bowler", "solid", 10000000),
    ("Sherfane Rutherford", "West Indies", "All-Rounder", "solid", 5000000),
    ("Romario Shepherd", "West Indies", "All-Rounder", "solid", 7500000),
    ("Akeal Hosein", "West Indies", "Bowler", "solid", 5000000),
    ("Gudakesh Motie", "West Indies", "Bowler", "solid", 5000000),
    ("Roston Chase", "West Indies", "All-Rounder", "solid", 3000000),
    ("Kyle Mayers", "West Indies", "All-Rounder", "solid", 7500000),
    ("Brandon King", "West Indies", "Batsman", "solid", 5000000),
    ("Rovman Powell", "West Indies", "All-Rounder", "star", 15000000),
    ("Shai Hope", "West Indies", "Wicket-Keeper", "solid", 7500000),
    ("Shimron Hetmyer", "West Indies", "Batsman", "star", 10000000),
    ("Odean Smith", "West Indies", "All-Rounder", "solid", 2000000),
    ("Keemo Paul", "West Indies", "All-Rounder", "solid", 2000000),
    ("Dominic Drakes", "West Indies", "All-Rounder", "solid", 2000000),
    ("Fabian Allen", "West Indies", "All-Rounder", "solid", 2000000),
    ("Obed McCoy", "West Indies", "Bowler", "solid", 3000000),
    ("Matthew Forde", "West Indies", "All-Rounder", "young", 2000000),
    ("Mustafizur Rahman", "Bangladesh", "Bowler", "star", 10000000),
    ("Litton Das", "Bangladesh", "Wicket-Keeper", "solid", 5000000),
    ("Taskin Ahmed", "Bangladesh", "Bowler", "solid", 7500000),
    ("Shoriful Islam", "Bangladesh", "Bowler", "solid", 5000000),
    ("Tanzim Hasan Sakib", "Bangladesh", "Bowler", "solid", 3000000),
    ("Rishad Hossain", "Bangladesh", "Bowler", "solid", 3000000),
    ("Sikandar Raza", "Zimbabwe", "All-Rounder", "star", 7500000),
]

# Generate more generic names for remaining players if required to hit exactly 510 players
FIRST_NAMES_INDIAN = ["Rohit", "Virat", "Jasprit", "Rishabh", "Ravindra", "Shubman", "Hardik", "Suryakumar", "Shreyas", "KL", "Ishan", "Yashasvi", "Sanju", "Mohammed", "Ravichandran", "Axar", "Kuldeep", "Yuzvendra", "Ruturaj", "Rinku", "Shivam", "Tilak", "Washington", "Ravi", "Arshdeep", "Shardul", "Deepak", "Bhuvneshwar", "Shikhar", "Dinesh", "Cheteshwar", "Ajinkya", "Umesh", "Ishant", "Wriddhiman", "Mayank", "Robin", "Manish", "Krunal", "Prithvi", "Venkatesh", "Nitish", "Rahul", "Shahrukh", "Shahbaz", "Varun", "Mohit", "Yash", "Harshit", "Abishek", "Ashutosh", "Shashank", "Sameer", "Naman", "Anshul", "Akash", "Sarfaraz", "Rajat", "Kamlesh", "Kartik", "Vijay", "Deepak", "Sandeep", "Jaydev", "Siddarth", "Suyash", "Harpreet", "Vidwath", "Anukul", "Tushar", "Piyush", "Amit", "Kedar", "Harbhajan", "Yuvraj", "Irfan", "Yusuf", "Zaheer", "Munaf", "Ashish", "Murali", "Gautam", "Parthiv", "Ambati", "Saurabh", "Vinay", "Manan", "Mandeep", "Pawan", "Karn", "Rishi", "Ankit", "Praveen", "Robin", "Suresh"]
LAST_NAMES_INDIAN = ["Sharma", "Kohli", "Bumrah", "Pant", "Jadeja", "Gill", "Pandya", "Yadav", "Iyer", "Rahul", "Kishan", "Jaiswal", "Samson", "Siraj", "Ashwin", "Patel", "Yadav", "Chahal", "Gaikwad", "Singh", "Dube", "Varma", "Sundar", "Bishnoi", "Singh", "Kumar", "Thakur", "Chahar", "Kumar", "Dhawan", "Karthik", "Pujara", "Rahane", "Yadav", "Saha", "Agarwal", "Uthappa", "Pandey", "Pandya", "Shaw", "Iyer", "Rana", "Tewatia", "Khan", "Ahmed", "Chakaravarthy", "Sharma", "Dayal", "Rana", "Porel", "Sharma", "Singh", "Rizvi", "Dhir", "Kamboj", "Deep", "Khan", "Patidar", "Nagarkoti", "Tyagi", "Shankar", "Chahar", "Sharma", "Unadkat", "Kaul", "Sharma", "Brar", "Kaverappa", "Roy", "Deshpande", "Chawla", "Mishra", "Jadav", "Singh", "Singh", "Pathan", "Pathan", "Khan", "Patel", "Nehra", "Vijay", "Gambhir", "Patel", "Rayudu", "Tiwary", "Kumar", "Vohra", "Singh", "Negi", "Sharma", "Dhawan", "Rajpoot", "Kumar", "Raina"]

FIRST_NAMES_OS = ["Mitchell", "Pat", "Travis", "Glenn", "Marcus", "Cameron", "David", "Steven", "Adam", "Josh", "Matthew", "Alex", "Nathan", "Sean", "Jason", "Ashton", "Chris", "Aaron", "Shaun", "Kane", "Jhye", "Spencer", "Xavier", "Jake", "Cooper", "Ben", "Daniel", "Riley", "Peter", "Matt", "Hilton", "Billy", "Moises", "Andrew", "Michael", "Scott", "Todd", "Jos", "Jonny", "Liam", "Sam", "Harry", "Ben", "Joe", "Phil", "Will", "Moeen", "Chris", "Mark", "Jofra", "Adil", "Rehan", "Gus", "Tom", "Ollie", "Zak", "Dawid", "Reece", "David", "Luke", "Brydon", "Jamie", "Shoaib", "Tymal", "Richard", "Saqib", "Eoin", "Kevin", "Andrew", "James", "Stuart", "Heinrich", "Quinton", "Aiden", "David", "Kagiso", "Anrich", "Marco", "Keshav", "Gerald", "Lungi", "Tabraiz", "Tristan", "Dewald", "Temba", "Reeza", "Rassie", "Faf", "Hashim", "Dale", "AB", "Jacques", "Ryan", "Nandre", "Wiaan", "Bjorn", "Tony", "Patrick", "Ottneil", "Lizaad", "Kwena", "Donovan", "Corbin", "Wayne", "Dwaine", "Rilee", "Colin", "Imran", "Nicholas", "Andre", "Sunil", "Kieron", "Dwayne", "Chris", "Jason", "Rovman", "Shai", "Brandon", "Kyle", "Alzarri", "Shimron", "Sherfane", "Romario", "Akeal", "Gudakesh", "Shamar", "Roston", "Johnson", "Evin", "Lendl", "Darren", "Marlon", "Denesh", "Carlos", "Sheldon", "Oshane", "Obed", "Hayden", "Fabian", "Odean", "Keemo", "Darren", "Devon", "Rachin", "Daryl", "Glenn", "Mitchell", "Trent", "Tim", "Lockie", "Ish", "Finn", "Tom", "Michael", "Mark", "Henry", "Colin", "Martin", "James", "Adam", "Will", "Kyle", "Ben", "William", "Jacob", "Blair", "Ajaz", "Tim", "Daniel", "Brendon", "Rashid", "Mohammad", "Rahmanullah", "Ibrahim", "Fazalhaq", "Mujeeb", "Naveen", "Azmatullah", "Najibullah", "Hazratullah", "Gulbadin", "Noor", "Qais", "Fareed", "Sharafuddin", "Rahmat", "Hashmatullah", "Ikram", "Nangeyalia", "Allah", "Wanindu", "Charith", "Pathum", "Kusal", "Sadeera", "Maheesh", "Matheesha", "Dilshan", "Dushmantha", "Lahiru", "Nuwan", "Dunith", "Kamindu", "Bhanuka", "Dasun", "Angelo", "Dinesh", "Avishka", "Dhananjaya", "Jeffrey", "Akila", "Kasun", "Asitha", "Vijayakanth", "Lasith", "Kumar", "Mahela", "Shakib", "Mustafizur", "Litton", "Najmul", "Towhid", "Taskin", "Shoriful", "Hasan", "Tanzim", "Soumya", "Mahmudullah", "Mushfiqur", "Tamim", "Mehidy", "Rishad", "Tanzid"]
LAST_NAMES_OS = ["Starc", "Cummins", "Head", "Maxwell", "Stoinis", "Green", "David", "Warner", "Smith", "Marsh", "Zampa", "Hazlewood", "Wade", "Carey", "Lyon", "Abbott", "Behrendorff", "Agar", "Lynn", "Finch", "Marsh", "Richardson", "Richardson", "Johnson", "Bartlett", "Fraser-McGurk", "Connolly", "Ellis", "Dwarshuis", "Sams", "Meredith", "Handscomb", "Harris", "Short", "Hardie", "Cartwright", "Turner", "Swepson", "Sangha", "Morris", "Paris", "Short", "Stanlake", "Henriques", "Sandhu", "Tye", "Neser", "Boland", "Murphy", "Lee", "Hayden", "Ponting", "Hussey", "Johnson", "Buttler", "Bairstow", "Livingstone", "Curran", "Brook", "Stokes", "Root", "Salt", "Jacks", "Ali", "Woakes", "Wood", "Archer", "Rashid", "Ahmed", "Atkinson", "Hartley", "Pope", "Crawley", "Duckett", "Malan", "Hales", "Roy", "Topley", "Willey", "Wood", "Carse", "Smith", "Bashir", "Potts", "Lawrence", "Jordan", "Mills", "Gleeson", "Mahmood", "Overton", "Billings", "Vince", "Dawson", "Curran", "Bethell", "Turner", "Morgan", "Pietersen", "Flintoff", "Anderson", "Broad", "Klaasen", "de Kock", "Markram", "Miller", "Rabada", "Nortje", "Jansen", "Maharaj", "Coetzee", "Ngidi", "Shamsi", "Stubbs", "Brevis", "Bavuma", "Hendricks", "van der Dussen", "du Plessis", "Amla", "Steyn", "de Villiers", "Kallis", "Rickelton", "Burger", "Mulder", "Fortuin", "de Zorzi", "Breetzke", "Kruger", "Baartman", "Williams", "Maphaka", "Ferreira", "Bosch", "Parnell", "Pretorius", "Rossouw", "Ingram", "Tahir", "Wiese", "Pooran", "Russell", "Narine", "Pollard", "Bravo", "Gayle", "Holder", "Powell", "Hope", "King", "Mayers", "Joseph", "Hetmyer", "Rutherford", "Shepherd", "Hosein", "Motie", "Joseph", "Chase", "Charles", "Lewis", "Simmons", "Bravo", "Samuels", "Ramdin", "Brathwaite", "Cottrell", "Thomas", "McCoy", "Walsh", "Forde", "Drakes", "Allen", "Smith", "Paul", "Sammy", "Richards", "Williamson", "Conway", "Ravindra", "Mitchell", "Phillips", "Santner", "Boult", "Southee", "Henry", "Ferguson", "Sodhi", "Allen", "Latham", "Bracewell", "Chapman", "Nicholls", "Munro", "Guptill", "Neesham", "Milne", "Young", "Jamieson", "Sears", "O'Rourke", "Duffy", "Tickner", "Patel", "Blundell", "Clarkson", "Seifert", "Vettori", "McCullum", "Khan", "Nabi", "Gurbaz", "Zadran", "Farooqi", "Rahman", "Haq", "Omarzai", "Zadran", "Zazai", "Naib", "Shahzad", "Janat", "Ahmad", "Ahmad", "Ahmad", "Ashraf", "Shah", "Shahidi", "Alikhil", "Kharote", "Ghazanfar", "Hasaranga", "Asalanka", "Nissanka", "Mendis", "Samarawickrama", "Theekshana", "Pathirana", "Madushanka", "Chameera", "Kumara", "Thushara", "Wellalage", "Mendis", "Rajapaksa", "Shanaka", "Mathews", "Chandimal", "Perera", "Fernando", "de Silva", "Vandersay", "Dananjaya", "Rajitha", "Fernando", "Viyaskanth", "Muralitharan", "Malinga", "Sangakkara", "Jayawardene", "Al Hasan", "Rahman", "Das", "Shanto", "Hridoy", "Ahmed", "Islam", "Mahmud", "Sakib", "Sarkar", "Mahmudullah", "Rahim", "Iqbal", "Miraz", "Hossain", "Hasan"]

RETIRED_PLAYERS_SET = {
    # India Legends
    "Sachin Tendulkar", "Rahul Dravid", "Sourav Ganguly", "Virender Sehwag", "Anil Kumble", "VVS Laxman",
    "Suresh Raina", "Yuvraj Singh", "Gautam Gambhir", "Robin Uthappa", "Ambati Rayudu", "Yusuf Pathan",
    "Irfan Pathan", "Pragyan Ojha", "Munaf Patel", "RP Singh", "S Sreesanth", "Ashish Nehra",
    "Murali Vijay", "Parthiv Patel", "Naman Ojha", "Saurabh Tiwary", "Abhishek Nayar", "Manpreet Gony",
    "Sreenath Aravind", "Praveen Kumar", "Vinay Kumar", "Pawan Negi", "Stuart Binny", "Iqbal Abdulla",
    "Abu Nechim", "Zaheer Khan", "Harbhajan Singh",
    # Australia Legends
    "Brett Lee", "Glenn McGrath", "Shane Warne", "Adam Gilchrist", "Michael Hussey", "Ricky Ponting",
    "Matthew Hayden", "Shane Watson", "Mitchell Johnson", "Brad Hogg", "Brad Hodge", "Daniel Christian",
    "George Bailey", "Shaun Tait", "Ryan Harris", "David Hussey",
    # South Africa Legends
    "Dale Steyn", "Jacques Kallis", "AB de Villiers", "Morné Morkel", "Albie Morkel", "Graeme Smith",
    "Herschelle Gibbs", "Makhaya Ntini", "Shaun Pollock", "Mark Boucher", "JP Duminy",
    # England Legends
    "Andrew Flintoff", "Kevin Pietersen", "James Anderson", "Stuart Broad", "Eoin Morgan", "Alex Hales",
    "Graeme Swann", "Paul Collingwood", "Ian Bell", "Andrew Strauss",
    # West Indies Legends
    "Chris Gayle", "Dwayne Bravo", "Kieron Pollard",
    "Viv Richards", "Brian Lara", "Courtney Walsh", "Curtly Ambrose", "Carl Hooper", "Ramnaresh Sarwan",
    "Shivnarine Chanderpaul", "Marlon Samuels", "Lendl Simmons", "Darren Sammy", "Dwayne Smith",
    # Sri Lanka Legends
    "Mahela Jayawardene", "Kumar Sangakkara", "Lasith Malinga", "Muralitharan", "Muttiah Muralitharan",
    "Chaminda Vaas", "Sanath Jayasuriya", "Tillakaratne Dilshan", "Upul Tharanga", "Ajantha Mendis",
    "Nuwan Kulasekara",
    # New Zealand Legends
    "Brendon McCullum", "Daniel Vettori", "Stephen Fleming", "Jacob Oram", "Scott Styris", "Shane Bond",
    # Pakistan Legends
    "Shahid Afridi", "Shoaib Akhtar", "Waqar Younis", "Wasim Akram", "Inzamam-ul-Haq", "Javed Miandad",
    "Saqlain Mushtaq", "Mushtaq Ahmed", "Misbah-ul-Haq", "Younis Khan", "Mohammad Yousuf",
    "Abdul Razzaq", "Shoaib Malik", "Mohammad Hafeez", "Kamran Akmal",
    # Bangladesh Legends
    "Mashrafe Mortaza", "Abdur Razzak", "Mohammad Ashraful"
}

DOMESTIC_AND_LEAGUE_PLAYERS = {
    # Indian Uncapped / Domestic / Bench Players
    "Abhimanyu Easwaran", "Akash Deep", "Rasikh Salam", "Vaibhav Arora", "Kartik Tyagi", "Kamlesh Nagarkoti",
    "Shivam Mavi", "Sandeep Warrier", "Siddarth Kaul", "Suyash Sharma", "Mayank Dagar", "Vijaykumar Vyshak",
    "Anukul Roy", "Harpreet Brar", "Prabhsimran Singh", "Atharva Taide", "Vidwath Kaverappa", "Ashutosh Sharma",
    "Shashank Singh", "Tanay Thyagarajan", "Sameer Rizvi", "Kumar Kushagra", "Robin Minz", "Swastik Chikara",
    "Sumit Kumar", "Vishnu Vinod", "Shams Mulani", "Shivalik Sharma", "Naman Dhir", "Saurabh Gopal",
    "Anshul Kamboj", "Vicky Ostwal", "Lalit Yadav", "Pravin Dubey", "Abishek Porel", "Ricky Bhui",
    "Sakib Hussain", "M Siddharth", "Shreyas Gopal", "Arjun Tendulkar", "Akash Madhwal", "Kumar Kartikeya",
    "Krishnappa Gowtham", "Karun Nair", "Sheldon Jackson", "Jagadeesan Narayan", "Ravisrinivasan Sai Kishore",
    "Simarjeet Singh", "Prashant Solanki", "Rajvardhan Hangargekar", "Mukesh Choudhary", "Tushar Deshpande",
    "Mayank Markande", "Umran Malik", "Priyam Garg", "Virat Singh", "Shahbaz Nadeem", "Murugan Ashwin",
    "Ankit Rajpoot", "Basil Thampi", "Barinder Sran", "Rishi Dhawan", "Karn Sharma", "Saurabh Tiwary",
    "Abhishek Nayar", "Manpreet Gony", "Sreenath Aravind", "Pawan Negi", "Stuart Binny", "Iqbal Abdulla",
    "Abu Nechim", "Harshit Rana", "Yash Dayal", "Mayank Yadav", "Ramandeep Singh", "Nitish Kumar Reddy",
    "Shahrukh Khan", "Rahul Tewatia", "Vijay Shankar", "Krunal Pandya", "Venkatesh Iyer", "Prithvi Shaw",
    # Overseas T20 League Globetrotters & Non-Marquee Internationals
    "Daniel Sams", "Daniel Christian", "Brad Hodge", "Brad Hogg", "Shaun Tait", "George Bailey",
    "David Hussey", "Matt Short", "Aaron Hardie", "Lance Morris", "Xavier Bartlett", "Cooper Connolly",
    "Riley Meredith", "Donovan Ferreira", "Kwena Maphaka", "Ryan Rickelton", "Lizaad Williams",
    "Patrick Kruger", "Tony de Zorzi", "Wiaan Mulder", "Allah Ghazanfar", "Vijayakanth Viyaskanth",
    "Jamie Smith", "Jacob Bethell", "Luke Wood", "Brydon Carse", "William O'Rourke", "Ben Sears",
    "Matthew Forde", "Tanzim Hasan Sakib", "Rishad Hossain", "Dewald Brevis", "Sherfane Rutherford",
    "Romario Shepherd", "Odean Smith", "Keemo Paul", "Dominic Drakes", "Fabian Allen", "Obed McCoy",
    "Gus Atkinson", "Tom Hartley", "Reece Topley"
}

def generate_full_pool():
    pool = []
    seen_names = set()
    player_id = 1
    
    # 1. First load core definitions
    for defn in PLAYER_DEFINITIONS:
        name = defn["name"]
        if name in seen_names:
            continue
        seen_names.add(name)
        
        # Determine stats and rating based on tier
        tier = defn["tier"]
        role = defn["role"]
        country = defn["country"]
        base_price = defn["base"]
        
        rating = 75
        if tier == "superstar":
            rating = 93 + (player_id % 7) # 93 - 99
        elif tier == "star":
            rating = 85 + (player_id % 8) # 85 - 92
        elif tier == "solid":
            rating = 75 + (player_id % 10) # 75 - 84
        elif tier == "young":
            rating = 65 + (player_id % 10) # 65 - 74
            
        stats = generate_stats(role, rating)
        
        if name in DOMESTIC_AND_LEAGUE_PLAYERS:
            base_price = min(base_price, 8000000) # cap at ₹80 Lakhs
            
        pool.append({
            "id": player_id,
            "name": name,
            "role": role,
            "rating": rating,
            "base_price": base_price,
            "stats": stats,
            "img": "",
            "overseas": country != "India",
            "country": country,
            "retired": name in RETIRED_PLAYERS_SET
        })
        player_id += 1

    # 2. Load extra mapped names
    for name, country, role, tier, base_price in ADDITIONAL_REAL_PLAYER_NAMES:
        if name in seen_names:
            continue
        seen_names.add(name)
        
        rating = 75
        if tier == "superstar":
            rating = 93 + (player_id % 7)
        elif tier == "star":
            rating = 85 + (player_id % 8)
        elif tier == "solid":
            rating = 75 + (player_id % 10)
        elif tier == "young":
            rating = 65 + (player_id % 10)
            
        stats = generate_stats(role, rating)
        
        if name in DOMESTIC_AND_LEAGUE_PLAYERS:
            base_price = min(base_price, 8000000) # cap at ₹80 Lakhs
            
        pool.append({
            "id": player_id,
            "name": name,
            "role": role,
            "rating": rating,
            "base_price": base_price,
            "stats": stats,
            "img": "",
            "overseas": country != "India",
            "country": country,
            "retired": name in RETIRED_PLAYERS_SET
        })
        player_id += 1

    # 3. If still under 515, generate randomized realistic combinations using real names list
    # To keep it realistic, we pull random first and last names from corresponding lists
    import random
    random.seed(42) # Ensure deterministic database generation
    
    while len(pool) < 515:
        is_overseas = random.choice([True, False, False]) # More Indian players
        role = random.choice(["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"])
        
        if is_overseas:
            country = random.choice(["Australia", "England", "South Africa", "West Indies", "New Zealand", "Afghanistan", "Sri Lanka", "Bangladesh"])
            f_name = random.choice(FIRST_NAMES_OS)
            l_name = random.choice(LAST_NAMES_OS)
        else:
            country = "India"
            f_name = random.choice(FIRST_NAMES_INDIAN)
            l_name = random.choice(LAST_NAMES_INDIAN)
            
        name = f"{f_name} {l_name}"
        if name in seen_names:
            continue
        seen_names.add(name)
        
        tier = random.choice(["solid", "solid", "young", "young", "star"])
        rating = 75
        if tier == "star":
            rating = random.randint(83, 89)
            base_price = random.choice([5000000, 8000000]) # cap at ₹80 Lakhs
        elif tier == "solid":
            rating = random.randint(73, 82)
            base_price = random.choice([3000000, 5000000])
        else:
            rating = random.randint(65, 72)
            base_price = 2000000
            
        stats = generate_stats(role, rating)
        
        pool.append({
            "id": player_id,
            "name": name,
            "role": role,
            "rating": rating,
            "base_price": base_price,
            "stats": stats,
            "img": "",
            "overseas": is_overseas,
            "country": country,
            "retired": name in RETIRED_PLAYERS_SET
        })
        player_id += 1

    # Apply custom ratings and stats overrides based on user's notes
    CUSTOM_RATINGS = {
        # Batters
        "Shubman Gill": 92,
        "Kane Williamson": 85,
        "Travis Head": 86,
        "Joe Root": 82,
        "Faf du Plessis": 83,
        "Yashasvi Jaiswal": 87,
        "Suryakumar Yadav": 93,
        "Rinku Singh": 80,
        "Shreyas Iyer": 85,
        "Shikhar Dhawan": 78,
        "Virat Kohli": 98,
        "David Miller": 83,
        "David Warner": 79,
        "Rohit Sharma": 96,
        "Abhishek Sharma": 80,
        "Ajinkya Rahane": 75,
        "Steven Smith": 94,
        "Shimron Hetmyer": 72,
        "Temba Bavuma": 84,
        "Ruturaj Gaikwad": 81,
        "Dewald Brevis": 78,
        "Tim David": 76,
        "Tilak Varma": 74,
        "Venkatesh Iyer": 80,
        "Babar Azam": 84,

        # All-Rounder (fast)
        "Hardik Pandya": 92,
        "Andre Russell": 76,
        "Kieron Pollard": 67,
        "Marcus Stoinis": 70,
        "Cameron Green": 77,
        "Ben Stokes": 91,
        "Sam Curran": 78,
        "Shivam Dube": 79,
        "Nitish Kumar Reddy": 78,
        "Jason Holder": 78,
        "Romario Shepherd": 73,
        "Mitchell Marsh": 77,
        "Shardul Thakur": 80,
        "Marco Jansen": 82,
        "Dwayne Bravo": 76,

        # All-Rounder (spin)
        "Moeen Ali": 69,
        "Mitchell Santner": 70,
        "Ravindra Jadeja": 80,
        "Axar Patel": 80,
        "Glenn Maxwell": 83,
        "Washington Sundar": 82,
        "Wanindu Hasaranga": 83,
        "Sunil Narine": 78,
        "Rachin Ravindra": 74,
        "Liam Livingstone": 72,
        "Krunal Pandya": 68,
        "Aiden Markram": 85,
        "Sikandar Raza": 72,
        "Michael Bracewell": 67,
        "Will Jacks": 73
    }

    for p in pool:
        if p["name"] in CUSTOM_RATINGS:
            p["rating"] = CUSTOM_RATINGS[p["name"]]
            p["stats"] = generate_stats(p["role"], p["rating"])

    return pool

def generate_stats(role, rating):
    # Generates a realistic stat line depending on role and rating
    import random
    
    # Calculate stats index based on rating
    factor = (rating - 50) / 50.0  # 0 to 1 range approx
    
    if role == "Batsman":
        runs = int(1000 + factor * 8000 + (rating % 10) * 120)
        avg = round(22 + factor * 28 + (rating % 5) * 0.5, 1)
        sr = round(115 + factor * 40 + (rating % 7) * 1.2, 1)
        return f"Runs: {runs}, Avg: {avg}, SR: {sr}"
        
    elif role == "Bowler":
        wickets = int(30 + factor * 180 + (rating % 10) * 5)
        econ = round(8.8 - factor * 2.3 + (rating % 3) * 0.1, 2)
        avg = round(29.5 - factor * 8.5 + (rating % 5) * 0.2, 1)
        return f"Wkts: {wickets}, Econ: {econ}, Avg: {avg}"
        
    elif role == "All-Rounder":
        runs = int(500 + factor * 4000 + (rating % 10) * 80)
        wickets = int(15 + factor * 110 + (rating % 5) * 3)
        sr = round(120 + factor * 35 + (rating % 4) * 1.5, 1)
        econ = round(9.2 - factor * 2.0 + (rating % 3) * 0.15, 2)
        return f"Runs: {runs} (SR {sr}), Wkts: {wickets} (Econ {econ})"
        
    elif role == "Wicket-Keeper":
        runs = int(800 + factor * 6000 + (rating % 10) * 100)
        sr = round(118 + factor * 32 + (rating % 5) * 1.1, 1)
        dismissals = int(15 + factor * 140 + (rating % 10) * 4)
        return f"Runs: {runs} (SR {sr}), Dismissals: {dismissals}"
        
    return "IPL Player Profile"

def main():
    print("Generating Cricket Player Database...")
    players = generate_full_pool()
    
    # Organize into presets
    # ipl_legends: Top 40 players in the database
    # all_time_legends: Legends/Superstars
    # full_pool: All players (at least 500)
    
    superstars = [p for p in players if p["rating"] >= 90]
    stars = [p for p in players if 80 <= p["rating"] < 90]
    others = [p for p in players if p["rating"] < 80]
    
    # Sort by rating descending
    players_sorted = sorted(players, key=lambda x: x["rating"], reverse=True)
    
    presets = {
        "ipl_legends": players_sorted[:60], # Top 60 superstars/legends
        "all_time_legends": [p for p in players_sorted if p["rating"] >= 95 or "Tendulkar" in p["name"] or "Dhoni" in p["name"] or "Richards" in p["name"] or "Warne" in p["name"] or "Akram" in p["name"] or "Kallis" in p["name"] or "de Villiers" in p["name"] or "Gilchrist" in p["name"] or "McGrath" in p["name"]][:30],
        "full_pool": players_sorted
    }
    
    # Verify count
    print(f"Total Unique Players Generated: {len(players)}")
    print(f"IPL Legends Preset: {len(presets['ipl_legends'])}")
    print(f"All Time Legends Preset: {len(presets['all_time_legends'])}")
    print(f"Full Pool Preset: {len(presets['full_pool'])}")
    
    # Write public/players.json
    public_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public"))
    if not os.path.exists(public_path):
        os.makedirs(public_path)
        
    json_path = os.path.join(public_path, "players.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)
    print(f"Wrote JSON to: {json_path}")
    
    # Write public/players-data.js
    js_path = os.path.join(public_path, "players-data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Fallback Player Database for Local file:// access\n")
        f.write("window.ALL_PLAYERS_DATA = ")
        json.dump(presets, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print(f"Wrote JavaScript to: {js_path}")

if __name__ == "__main__":
    main()
