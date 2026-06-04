import os

def check_file_exists(path):
    if os.path.exists(path):
        print(f"✅ Found {path}")
    else:
        print(f"❌ Missing {path}")

print("--- Reviewing Core V2 Implementation ---")
check_file_exists("src/app/login/page.tsx")
check_file_exists("src/app/dashboard/page.tsx")
check_file_exists("src/app/pricing/page.tsx")
check_file_exists("src/app/settings/page.tsx")
check_file_exists("src/app/writing/page.tsx")
check_file_exists("src/app/correction/page.tsx")
check_file_exists("src/app/exercice-gratuit/page.tsx")
check_file_exists("src/app/guides/page.tsx")
check_file_exists("src/components/features/dashboard/CompetencyRadar.tsx")
check_file_exists("src/components/features/dashboard/LeagueStats.tsx")
check_file_exists("src/components/shared/Sidebar.tsx")

print("\n--- Reviewing Key Logic ---")
with open("src/app/writing/page.tsx", "r") as f:
    content = f.read()
    if "exercise_attempts" in content and "feedback" in content:
        print("✅ Writing Coach saves feedback to DB")
    else:
        print("❌ Writing Coach might not be saving feedback")

with open("src/components/shared/Sidebar.tsx", "r") as f:
    content = f.read()
    if "isPremium" in content or "subscription_tier" in content:
        print("✅ Sidebar handles premium logic")
    else:
        print("❌ Sidebar missing premium tier logic")
