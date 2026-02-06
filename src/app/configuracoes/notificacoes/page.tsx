'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCliente } from '@/contexts/ClienteContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import {
  Mail,
  MessageSquare,
  Send,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Lock,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface NotificationSettings {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
  smtp_enabled: boolean
  evolution_api_base_url: string
  evolution_api_key: string
  evolution_instance_name: string
  whatsapp_enabled: boolean
  email_template_subject: string
  email_template_body: string
  whatsapp_template: string
}

const defaultSettings: NotificationSettings = {
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: 'NeoSale',
  smtp_secure: false,
  smtp_enabled: false,
  evolution_api_base_url: '',
  evolution_api_key: '',
  evolution_instance_name: '',
  whatsapp_enabled: false,
  email_template_subject: 'New Lead Assigned: {{lead_name}}',
  email_template_body: '<h2>New Lead</h2><p>Lead: {{lead_name}}</p>',
  whatsapp_template: 'New lead: *{{lead_name}}* - {{lead_phone}}',
}

export default function NotificacoesPage() {
  useRequireAuth()
  const { profile } = useAuth()
  const { selectedClienteId: clienteId } = useCliente()
  const { canManageSettings } = usePermissions()

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const fetchSettings = useCallback(async () => {
    if (!clienteId) return

    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/settings/notifications`, {
        headers: { cliente_id: clienteId },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [clienteId, apiUrl])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = async () => {
    if (!clienteId) return

    try {
      setSaving(true)
      const response = await fetch(`${apiUrl}/api/settings/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cliente_id: clienteId,
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!clienteId || !testEmail) return

    try {
      setTestingEmail(true)
      const response = await fetch(
        `${apiUrl}/api/settings/notifications/test/email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cliente_id: clienteId,
          },
          body: JSON.stringify({ recipientEmail: testEmail }),
        }
      )

      const result = await response.json()
      if (result.success) {
        toast.success('Test email sent!')
      } else {
        toast.error(result.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Error testing email:', error)
      toast.error('Error sending test email')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleTestWhatsApp = async () => {
    if (!clienteId || !testPhone) return

    try {
      setTestingWhatsApp(true)
      const response = await fetch(
        `${apiUrl}/api/settings/notifications/test/whatsapp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cliente_id: clienteId,
          },
          body: JSON.stringify({ recipientPhone: testPhone }),
        }
      )

      const result = await response.json()
      if (result.success) {
        toast.success('Test WhatsApp sent!')
      } else {
        toast.error(result.error || 'Failed to send test WhatsApp')
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error)
      toast.error('Error sending test WhatsApp')
    } finally {
      setTestingWhatsApp(false)
    }
  }

  if (!canManageSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to manage notification settings
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notification Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure how notifications are sent when leads are assigned
        </p>
      </div>

      <div className="space-y-8">
        {/* Email SMTP Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email (SMTP)
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure SMTP settings for email notifications
              </p>
            </div>
            <label className="ml-auto flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="smtp_enabled"
                checked={settings.smtp_enabled}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enabled
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                name="smtp_host"
                value={settings.smtp_host}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <input
                type="number"
                name="smtp_port"
                value={settings.smtp_port}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                name="smtp_user"
                value={settings.smtp_user}
                onChange={handleChange}
                placeholder="your-email@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="smtp_password"
                  value={settings.smtp_password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Email
              </label>
              <input
                type="email"
                name="smtp_from_email"
                value={settings.smtp_from_email}
                onChange={handleChange}
                placeholder="noreply@yourcompany.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Name
              </label>
              <input
                type="text"
                name="smtp_from_name"
                value={settings.smtp_from_name}
                onChange={handleChange}
                placeholder="NeoSale"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Test Email */}
          <div className="mt-4 flex items-center gap-4">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail || !testEmail || !settings.smtp_enabled}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Test Email
            </button>
          </div>
        </section>

        {/* WhatsApp Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                WhatsApp (Evolution API)
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure Evolution API for WhatsApp notifications
              </p>
            </div>
            <label className="ml-auto flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="whatsapp_enabled"
                checked={settings.whatsapp_enabled}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enabled
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base URL
              </label>
              <input
                type="url"
                name="evolution_api_base_url"
                value={settings.evolution_api_base_url}
                onChange={handleChange}
                placeholder="https://evolution.yourcompany.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="evolution_api_key"
                  value={settings.evolution_api_key}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instance Name
              </label>
              <input
                type="text"
                name="evolution_instance_name"
                value={settings.evolution_instance_name}
                onChange={handleChange}
                placeholder="neosale-instance"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Test WhatsApp */}
          <div className="mt-4 flex items-center gap-4">
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="5511999999999"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleTestWhatsApp}
              disabled={
                testingWhatsApp || !testPhone || !settings.whatsapp_enabled
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingWhatsApp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Test WhatsApp
            </button>
          </div>
        </section>

        {/* Templates Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Message Templates
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Available variables: {'{{lead_name}}'}, {'{{lead_phone}}'},{' '}
            {'{{lead_email}}'}, {'{{lead_company}}'}, {'{{assigned_at}}'},{' '}
            {'{{assigned_by}}'}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                name="email_template_subject"
                value={settings.email_template_subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Body (HTML)
              </label>
              <textarea
                name="email_template_body"
                value={settings.email_template_body}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp Message
              </label>
              <textarea
                name="whatsapp_template"
                value={settings.whatsapp_template}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#403CCF] text-white rounded-lg hover:bg-[#403CCF]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
