import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-xl font-bold">Terms of Service / شروط الاستخدام</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-10">

        {/* ── ARABIC ──────────────────────────────────────────────── */}
        <section dir="rtl" className="space-y-6 text-right">
          <div className="flex items-center justify-end gap-3">
            <h2 className="text-2xl font-bold">شروط الاستخدام</h2>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">آخر تحديث: يونيو 2025</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">١. القبول بالشروط</h3>
              <p className="text-muted-foreground leading-relaxed">
                باستخدامك لتطبيق SHVI أو تسجيلك فيه، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على أي جزء منها، يُرجى التوقف عن استخدام التطبيق.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٢. الخدمة المقدّمة</h3>
              <p className="text-muted-foreground leading-relaxed">
                SHVI وسيط تقني يربط الزبائن بالحلاقين المستقلين. نحن <strong className="text-foreground">لسنا مزوداً مباشراً لخدمة الحلاقة</strong>، ولا نتحمل مسؤولية جودة الخدمة المقدّمة من الحلاق. يتحمل الحلاق المسؤولية الكاملة عن خدمته.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٣. حسابات المستخدمين</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• يجب أن تكون جميع المعلومات المقدّمة عند التسجيل صحيحة ودقيقة</li>
                <li>• أنت مسؤول عن الحفاظ على سرية كلمة مرورك</li>
                <li>• الحد الأدنى للعمر للاستخدام هو 18 سنة</li>
                <li>• يُحظر امتلاك أكثر من حساب شخصي واحد</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٤. مسؤوليات الزبون</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• الحضور في الوقت المحدد أو الإلغاء مسبقاً بوقت كافٍ</li>
                <li>• التعامل مع الحلاق باحترام ولياقة</li>
                <li>• تقديم موقع جغرافي صحيح ودقيق عند طلب الخدمة المنزلية</li>
                <li>• الامتناع عن تقديم معلومات مضللة أو مزيفة</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٥. مسؤوليات الحلاق</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• تقديم الخدمة بالجودة المناسبة والمتفق عليها</li>
                <li>• الالتزام بالمواعيد المحددة وإخطار الزبون فوراً عند أي تغيير</li>
                <li>• حماية خصوصية الزبون وبياناته الشخصية</li>
                <li>• الامتثال لجميع اشتراطات الصحة والسلامة المهنية</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٦. الإلغاء والغياب</h3>
              <p className="text-muted-foreground leading-relaxed">
                يُشجَّع على إلغاء الموعد قبل ساعة على الأقل من الموعد المحدد. الغياب المتكرر دون إلغاء قد يؤدي إلى تقييد الحساب أو إيقافه.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٧. السلوك المحظور</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• انتهاك خصوصية المستخدمين الآخرين</li>
                <li>• نشر محتوى مسيء أو مضلل في التقييمات</li>
                <li>• محاولة اختراق أو التلاعب بمنظومة التطبيق</li>
                <li>• استخدام التطبيق لأي غرض غير مشروع</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٨. تعديل الشروط</h3>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بالتغييرات الجوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد التعديل يُعدّ قبولاً بالشروط الجديدة.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">٩. التواصل معنا</h3>
              <p className="text-muted-foreground leading-relaxed">لأي استفسارات أو شكاوى:</p>
              <p className="font-medium text-primary">support@shvi.app</p>
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-muted-foreground/30" />

        {/* ── ENGLISH ─────────────────────────────────────────────── */}
        <section dir="ltr" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Terms of Service</h2>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: June 2025</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                By using or registering on SHVI, you agree to be bound by these terms and conditions. If you do not agree with any part of them, please stop using the app.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">2. Service Provided</h3>
              <p className="text-muted-foreground leading-relaxed">
                SHVI is a technology intermediary that connects customers with independent barbers. We are <strong className="text-foreground">not a direct provider of barbering services</strong> and bear no responsibility for the quality of service delivered by the barber. The barber bears full responsibility for their service.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">3. User Accounts</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• All information provided at registration must be true and accurate</li>
                <li>• You are responsible for maintaining the confidentiality of your password</li>
                <li>• The minimum age to use the app is 18 years old</li>
                <li>• Owning more than one personal account is prohibited</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">4. Customer Responsibilities</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• Arrive on time or cancel with sufficient advance notice</li>
                <li>• Treat the barber with respect and courtesy</li>
                <li>• Provide an accurate location when requesting home service</li>
                <li>• Refrain from providing misleading or false information</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">5. Barber Responsibilities</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• Deliver the service at the agreed quality and standard</li>
                <li>• Honor scheduled appointments and notify the customer immediately of any changes</li>
                <li>• Protect the customer's privacy and personal data</li>
                <li>• Comply with all occupational health and safety requirements</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">6. Cancellations & No-Shows</h3>
              <p className="text-muted-foreground leading-relaxed">
                We encourage cancelling appointments at least one hour in advance. Repeated no-shows without cancellation may result in account restrictions or suspension.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">7. Prohibited Conduct</h3>
              <ul className="text-muted-foreground space-y-1 leading-relaxed list-none">
                <li>• Violating the privacy of other users</li>
                <li>• Posting offensive or misleading content in reviews</li>
                <li>• Attempting to hack or manipulate the app's systems</li>
                <li>• Using the app for any unlawful purpose</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">8. Modifications to Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. You will be notified of material changes via the app or email. Continued use of the app after modification constitutes acceptance of the new terms.
            </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">9. Contact Us</h3>
              <p className="text-muted-foreground leading-relaxed">For any inquiries or complaints:</p>
              <p className="font-medium text-primary">support@shvi.app</p>
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
