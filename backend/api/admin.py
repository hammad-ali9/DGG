from django.contrib import admin
from .models import Profile, Application, Document, AuditLog, PolicySetting, FormBTracking

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'beneficiary_number', 'is_sfa_active', 'profile_completeness')
    search_fields = ('user__username', 'beneficiary_number')

@admin.register(PolicySetting)
class PolicySettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'setting_type', 'value', 'stream', 'status', 'is_active')
    list_filter = ('setting_type', 'stream', 'status', 'is_active')
    search_fields = ('key', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('key', 'setting_type', 'value', 'description', 'is_active')
        }),
        ('Policy Context', {
            'fields': ('stream', 'status', 'dependent_count', 'credential_type'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class DocumentInline(admin.TabularInline):
    model = Document
    extra = 1

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'form_type', 'student', 'status', 'semester', 'created_at')
    list_filter = ('status', 'form_type', 'semester')
    search_fields = ('student__username', 'form_type', 'institution')
    inlines = [DocumentInline]
    
    actions = ['approve_applications', 'deny_applications']

    def approve_applications(self, request, queryset):
        queryset.update(status='approved')
    approve_applications.short_description = "Approve selected applications"

    def deny_applications(self, request, queryset):
        queryset.update(status='denied')
    deny_applications.short_description = "Deny selected applications"

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'application', 'is_verified', 'uploaded_at')
    list_filter = ('is_verified',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'performed_by', 'timestamp', 'application')
    list_filter = ('action', 'timestamp')

@admin.register(FormBTracking)
class FormBTrackingAdmin(admin.ModelAdmin):
    list_display = ('form_a_submission', 'institution_name', 'status', 'due_date', 'is_overdue_display', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('institution_name', 'registrar_email', 'form_a_submission__student__username')
    readonly_fields = ('created_at', 'updated_at', 'is_overdue_display')
    fieldsets = (
        ('Form A Link', {
            'fields': ('form_a_submission',)
        }),
        ('Registrar Information', {
            'fields': ('registrar_email', 'institution_name')
        }),
        ('Status Tracking', {
            'fields': ('status', 'is_overdue_display')
        }),
        ('Dates', {
            'fields': ('sent_date', 'due_date', 'submitted_date', 'verification_date')
        }),
        ('Communication', {
            'fields': ('reminder_count', 'last_reminder_sent', 'notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_overdue_display(self, obj):
        return obj.is_overdue()
    is_overdue_display.short_description = 'Is Overdue'
    is_overdue_display.boolean = True

