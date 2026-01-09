from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'order', 'payment_method', 'amount', 'status', 'payment_date']
    list_filter = ['status', 'payment_method', 'payment_date']
    search_fields = ['transaction_id', 'order__order_number']
    readonly_fields = ['payment_date']

    actions = ['approve_proof', 'reject_proof']

    def approve_proof(self, request, queryset):
        updated = queryset.update(proof_status='approved')
        self.message_user(request, f"Approved proof for {updated} payment(s)")

    approve_proof.short_description = 'Approve selected payment proofs'

    def reject_proof(self, request, queryset):
        updated = queryset.update(proof_status='rejected')
        self.message_user(request, f"Rejected proof for {updated} payment(s)")

    reject_proof.short_description = 'Reject selected payment proofs'
