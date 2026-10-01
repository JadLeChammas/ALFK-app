import { QuestionReviewList } from '@/components/QuestionReview';
import { BackLink, PageHeader, Screen } from '@/components/ui/Screen';
import { useI18n } from '@/i18n';

/** Admins: anonymous questions to verify before they are published. */
export default function AdminQuestions() {
  const { d } = useI18n();
  return (
    <Screen maxWidth={900}>
      <BackLink label={d.admin.title} href="/admin" />
      <PageHeader title={d.questions.queue} subtitle={d.questions.queueSub} />
      <QuestionReviewList showEmpty />
    </Screen>
  );
}
