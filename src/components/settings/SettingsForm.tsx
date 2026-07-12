import React, { useState } from 'react';
import { DeviceSettings, User } from '@/src/types';
import { Save, Bell, Sliders, Shield, User as UserIcon, Link2, BellRing, Key, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ProfileSettings } from './ProfileSettings';

interface SettingsFormProps {
  settings: DeviceSettings;
  onSave: (settings: DeviceSettings) => void;
  user: User;
  onUserUpdate: (updatedUser: Partial<User>) => void;
  onLogout: () => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ settings, onSave, user, onUserUpdate, onLogout }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState('Profile');
  const [formData, setFormData] = useState<DeviceSettings>(settings);

  const tabs = [
    { id: 'Profile', icon: UserIcon },
    { id: 'Alerts', icon: BellRing },
    { id: 'Security', icon: ShieldCheck },
    { id: 'Connectivity', icon: Link2 },
    { id: 'API Access', icon: Key },
  ];

  const sections = [
    {
      title: 'General Preferences',
      icon: Sliders,
      description: 'Configure basic application behavior and update intervals.',
      fields: [
        { label: 'Update Frequency (seconds)', key: 'updateFrequency', type: 'number', min: 1, max: 60 },
        { label: 'Efficiency Alert Threshold (%)', key: 'efficiencyThreshold', type: 'number', min: 0, max: 100 },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Choose how you want to be notified about system events.',
      fields: [
        { label: 'Push Notifications', key: 'notificationEnabled', type: 'toggle' },
        { label: 'Alert on Device Offline', key: 'alertOnOffline', type: 'toggle' },
      ]
    }
  ];

  const handleChange = (key: keyof DeviceSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500">Global configuration for your monitoring dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
                activeSettingsTab === tab.id 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className={cn("w-4 h-4", activeSettingsTab === tab.id ? "text-white" : "text-slate-400")} />
              {tab.id}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeSettingsTab === 'Profile' && (
            <ProfileSettings user={user} onUserUpdate={onUserUpdate} onLogout={onLogout} />
          )}

          {activeSettingsTab === 'Alerts' && (
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <section.icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{section.title}</h3>
                        <p className="text-xs text-slate-500">{section.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {section.fields.map((field) => (
                      <div key={field.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">{field.label}</label>
                        {field.type === 'number' ? (
                          <input
                            type="number"
                            value={formData[field.key as keyof DeviceSettings] as number}
                            onChange={(e) => handleChange(field.key as keyof DeviceSettings, parseInt(e.target.value))}
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => handleChange(field.key as keyof DeviceSettings, !formData[field.key as keyof DeviceSettings])}
                            className={`w-11 h-6 rounded-full transition-all relative ${
                              formData[field.key as keyof DeviceSettings] ? 'bg-amber-500' : 'bg-slate-200'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                              formData[field.key as keyof DeviceSettings] ? 'left-6' : 'left-1'
                            }`}></div>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                  Discard Changes
                </button>
                <button 
                  onClick={() => onSave(formData)}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {activeSettingsTab === 'Security' && (
            <div className="bg-amber-900 rounded-2xl p-6 text-white overflow-hidden relative group">
              <Shield className="absolute -right-8 -bottom-8 w-48 h-48 text-amber-800 opacity-50 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Advanced Security</h3>
                <p className="text-amber-200/80 text-sm max-w-md mb-4">
                  Enable two-factor authentication and hardware key verification for maximum system protection.
                </p>
                <button className="px-4 py-2 bg-white text-amber-900 rounded-lg text-sm font-bold hover:bg-amber-50 transition-all">
                  Enable 2FA Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
