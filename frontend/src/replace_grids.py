import os
import re

dir_path = 'd:/hospital/hospital-management/frontend/src'
pattern = re.compile(r'<div style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', gap: \d+(?:px)?,?.*?}}>')
pattern_14_16 = re.compile(r'<div style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', gap: (?:14|16).*?}}>')

count = 0
for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if pattern.search(content):
                new_content = pattern.sub('<div className="form-grid">', content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated {file}')

print(f"Total files updated: {count}")
