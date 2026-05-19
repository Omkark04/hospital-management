import os, glob

replacements = {
    '💊': '<FaPrescriptionBottleAlt />',
    '🧑‍⚕️': '<FaUserInjured />',
    '🎯': '<FaBullseye />',
    '📝': '<FaFileAlt />',
    '👥': '<FaUsers />',
    '🧾': '<FaFileInvoiceDollar />',
    '📦': '<FaBoxOpen />',
    '🏥': '<FaHospital />',
    '💬': '<FaCommentDots />',
    '🏢': '<FaBuilding />',
    '✅': '<FaCheckCircle />',
    '📅': '<FaCalendarAlt />'
}

imports = {
    '<FaPrescriptionBottleAlt />': 'FaPrescriptionBottleAlt',
    '<FaUserInjured />': 'FaUserInjured',
    '<FaBullseye />': 'FaBullseye',
    '<FaFileAlt />': 'FaFileAlt',
    '<FaUsers />': 'FaUsers',
    '<FaFileInvoiceDollar />': 'FaFileInvoiceDollar',
    '<FaBoxOpen />': 'FaBoxOpen',
    '<FaHospital />': 'FaHospital',
    '<FaCommentDots />': 'FaCommentDots',
    '<FaBuilding />': 'FaBuilding',
    '<FaCheckCircle />': 'FaCheckCircle',
    '<FaCalendarAlt />': 'FaCalendarAlt'
}

dashboard_dir = r'd:\hospital\hospital-management\frontend\src\pages\dashboard'
for root, dirs, files in os.walk(dashboard_dir):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False
            needed_imports = set()
            for emoji, replacement in replacements.items():
                if emoji in content:
                    content = content.replace(emoji, replacement)
                    needed_imports.add(imports[replacement])
                    modified = True
            
            if '🔍' in content:
                content = content.replace('🔍 ', '')
                modified = True
                
            if modified:
                # Add imports if necessary
                if needed_imports:
                    import_str = 'import { ' + ', '.join(needed_imports) + " } from 'react-icons/fa';"
                    if 'react-icons/fa' in content:
                        # Append to existing
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if 'react-icons/fa' in line:
                                existing = line[line.find('{')+1:line.find('}')].split(',')
                                existing = [x.strip() for x in existing if x.strip()]
                                for ni in needed_imports:
                                    if ni not in existing:
                                        existing.append(ni)
                                lines[i] = 'import { ' + ', '.join(existing) + " } from 'react-icons/fa';"
                                break
                        content = '\n'.join(lines)
                    else:
                        content = import_str + '\n' + content

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Updated {file}')
