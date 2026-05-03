from django.db import models
from django.conf import settings


class ProductCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    discount_percentage = models.PositiveIntegerField(default=0, help_text='Category-wide discount')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Product Category'
        verbose_name_plural = 'Product Categories'
        db_table = 'product_categories'
        ordering = ['name']

    def __str__(self):
        return self.name


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
    category = models.ForeignKey(
        ProductCategory, on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='products'
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    # Cloudinary URL — populated once Cloudinary is enabled
    image_url = models.URLField(blank=True, help_text='Cloudinary image URL')
    # WhatsApp enquiry number (defaults to settings)
    whatsapp_number = models.CharField(max_length=15, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    display_quantity = models.CharField(max_length=50, blank=True, help_text='e.g. 500ml, 100 Tablets')
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    for_public = models.BooleanField(default=True, help_text='Visible on public health store')
    for_patients = models.BooleanField(default=False, help_text='Available for doctor prescriptions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_price(self):
        """Calculate price after product and category discounts."""
        from decimal import Decimal
        cat_discount = self.category.discount_percentage if self.category else 0
        total_discount = max(self.discount_percentage, cat_discount)
        if total_discount > 0:
            return (self.price * (Decimal('100') - Decimal(str(total_discount)))) / Decimal('100')
        return self.price

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.category}) — ₹{self.price}'

    def get_whatsapp_link(self):
        number = self.whatsapp_number or settings.WHATSAPP_ENQUIRY_NUMBER
        price_display = f'₹{self.final_price}'
        if self.final_price < self.price:
            price_display = f'₹{self.final_price} (was ₹{self.price})'
            
        message = f'Hi, I am interested in {self.name} priced at {price_display}.'
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
