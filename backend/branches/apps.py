from django.apps import AppConfig


class BranchesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'branches'
    verbose_name = 'Branch Management'

    def ready(self):
        import os
        # Prevent running twice during dev server start
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('RUN_MAIN'):
            try:
                from django.core.management import call_command
                print("Running database migrations programmatically...")
                call_command('makemigrations')
                call_command('migrate')
                print("Migrations completed successfully.")
            except Exception as e:
                print(f"Auto-migration error: {e}")
