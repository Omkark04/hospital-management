from django.db import models
from django.conf import settings


class ProductCategory(models.TextChoices):
    MEDICINE = 'medicine', 'Medicine'
    AYURVEDIC = 'ayurvedic', 'Ayurvedic'
    SUPPLEMENT = 'supplement', 'Supplement'
    EQUIPMENT = 'equipment', 'Equipment'
    OTHER = 'other', 'Other'


class EnquiryStatus(models.TextChoices):
    NEW = 'new', 'New'
    CONTACTED = 'contacted', 'Contacted'
    CLOSED = 'closed', 'Closed'


class Product(models.Model):
    owner = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='products', limit_choices_to={'role': 'owner'}
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=ProductCategory.choices, default=ProductCategory.OTHER)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    # Cloudinary URL — populated once Cloudinary is enabled
    image_url = models.URLField(blank=True, help_text='Cloudinary image URL')
    # WhatsApp enquiry number (defaults to settings)
    whatsapp_number = models.CharField(max_length=15, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)  # Controls public listing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.category}) — ₹{self.price}'

    def get_whatsapp_link(self):
        number = self.whatsapp_number or settings.WHATSAPP_ENQUIRY_NUMBER
        message = f'Hi, I am interested in {self.name} priced at ₹{self.price}.'
        return f'https://wa.me/{number.replace("+", "")}?text={message}'


class ProductEnquiry(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='enquiries')
    enquirer_name = models.CharField(max_length=100)
    enquirer_phone = models.CharField(max_length=15)
    enquirer_email = models.EmailField(blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=EnquiryStatus.choices, default=EnquiryStatus.NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product Enquiry'
        verbose_name_plural = 'Product Enquiries'
        db_table = 'product_enquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f'Enquiry for {self.product.name} by {self.enquirer_name}'
