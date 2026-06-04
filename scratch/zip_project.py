import os
import zipfile

def zip_project():
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(project_dir, 'auction.zip')
    
    files_to_zip = [
        'server.py',
        'Procfile',
        'requirements.txt',
        'discloud.config'
    ]
    
    folders_to_zip = [
        'public'
    ]
    
    print(f"Creating ZIP archive at: {zip_path}")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Zip files
        for f in files_to_zip:
            f_path = os.path.join(project_dir, f)
            if os.path.exists(f_path):
                print(f"Adding file: {f}")
                zip_file.write(f_path, f)
                
        # Zip folders
        for folder in folders_to_zip:
            folder_path = os.path.join(project_dir, folder)
            if os.path.exists(folder_path):
                print(f"Adding folder: {folder}")
                for root, dirs, files in os.walk(folder_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, project_dir)
                        zip_file.write(file_path, relative_path)
                        
    print("ZIP package successfully created!")

if __name__ == '__main__':
    zip_project()
