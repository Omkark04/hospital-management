"""
apps/products/models.py — Medicines / Ayurvedic products catalog.
"""
from django.db import models
from apps.core.models import BaseModel


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "products_category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(BaseModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    description = models.TextField(blank=True)
    ingredients = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True)
    is_featured = models.BooleanField(default=False)
    is_prescription_required = models.BooleanField(default=False)

    class Meta:
        db_table = "products_product"

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        return self.discounted_price if self.discounted_price else self.price


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    cloudinary_public_id = models.CharField(max_length=200)
    url = models.URLField()
    is_primary = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "products_productimage"
