import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Privacy Policy / سياسة الخصوصية</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-10">

        {/* ── ARABIC ──────────────────────────────────────────────── */}
        <section dir="rtl" className="space-y-6 text-right">
          <div className="flex items-center justify-end gap-3">
            <h2 className="text-2xl font-bold">سياسة الخصوصية</h2>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">آخر تحديث: يونيو 2025</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">مقدمة</h3>
              <p className="text-muted-foreground leading-relaxed">
                تطبيق SHVI منصة لحجز مواعيد الحلاقين. نحن ملتزمون بحماية خصوصيتك وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية. تصف هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">ما البيانات التي نجمعها؟</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• الاسم والبريد الإلكتروني — لإنشاء الحساب</li>
                <li>• رقم الجوال — للتواصل وتأكيد المواعيد</li>
                <li>• الموقع الجغرافي GPS — لإيجاد الحلاقين القريبين وخدمة الحلاقة المنزلية</li>
                <li>• بيانات الحجز — التواريخ والخدمات المطلوبة</li>
                <li>• التقييمات والمراجعات — لتحسين جودة الخدمة</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">كيف نستخدم بياناتك؟</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• تقديم خدمة الحجز وإدارة المواعيد</li>
                <li>• إرسال الإشعارات المتعلقة بمواعيدك</li>
                <li>• تحسين التطبيق وتطوير الخدمات</li>
                <li>• الامتثال للمتطلبات القانونية والتنظيمية</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">من يرى بياناتك؟</h3>
              <p className="text-muted-foreground leading-relaxed">
                الحلاق المحجوز يرى اسمك ورقم جوالك وموقعك لأغراض تقديم الخدمة فقط. <strong className="text-foreground">لا نبيع بياناتك لأي طرف ثالث</strong> ولا نشاركها إلا بموجب إلزام قانوني.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">الموقع الجغرافي</h3>
              <p className="text-muted-foreground leading-relaxed">
                نطلب إذنك الصريح للوصول إلى موقعك. يُستخدم الموقع فقط لإيجاد الحلاقين القريبين أو تنفيذ خدمة الحلاقة المنزلية. لا يوجد تتبع للموقع في الخلفية.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">حقوقك</h3>
              <p className="text-muted-foreground leading-relaxed">
                يحق لك الاطلاع على بياناتك الشخصية وتصحيحها أو طلب حذفها في أي وقت. للتواصل معنا:
              </p>
              <p className="font-medium text-primary">support@shvi.app</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">أمان البيانات</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• كلمات المرور مشفّرة باستخدام bcrypt</li>
                <li>• جميع الاتصالات محمية بـ HTTPS</li>
                <li>• لا نخزن بيانات بطاقات الدفع</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-muted-foreground/30" />

        {/* ── ENGLISH ─────────────────────────────────────────────── */}
        <section dir="ltr" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Privacy Policy</h2>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: June 2025</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Introduction</h3>
              <p className="text-muted-foreground leading-relaxed">
                SHVI is a barber appointment booking platform. We are committed to protecting your privacy in compliance with the Personal Data Protection Law of the Kingdom of Saudi Arabia. This policy describes how your data is collected, used, and protected.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">What Data Do We Collect?</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• Name and email address — for account creation</li>
                <li>• Phone number — for communication and appointment confirmations</li>
                <li>• GPS location — to find nearby barbers and for home service</li>
                <li>• Booking data — dates and requested services</li>
                <li>• Ratings and reviews — to improve service quality</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">How Do We Use Your Data?</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• Providing the booking service and managing appointments</li>
                <li>• Sending notifications related to your appointments</li>
                <li>• Improving the app and developing services</li>
                <li>• Compliance with legal and regulatory requirements</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Who Sees Your Data?</h3>
              <p className="text-muted-foreground leading-relaxed">
                The booked barber can see your name, phone number, and location solely for the purpose of providing the service. <strong className="text-foreground">We do not sell your data to any third party</strong> and only share it under legal obligation.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Location Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                We request your explicit permission to access your location. Location is only used to find nearby barbers or to execute home barbering services. There is no background location tracking.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Your Rights</h3>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or request deletion of your personal data at any time. Contact us at:
              </p>
              <p className="font-medium text-primary">support@shvi.app</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Data Security</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• Passwords are encrypted using bcrypt</li>
                <li>• All connections are protected by HTTPS</li>
                <li>• We do not store payment card data</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="pb-8 text-center text-sm text-muted-foreground">
          SHVI © 2025
        </div>
      </main>
    </div>
  );
}
