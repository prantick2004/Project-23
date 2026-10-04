import { FeatureGrid, Section, SectionHeading } from '@/components/marketing/Sections'
import { ButtonLink } from '@/components/ui/Button'
import { features } from '@/data/marketing'

export default function Features() {
  return (
    <>
      <Section className="pt-36 sm:pt-40">
        <SectionHeading eyebrow="Features" title="Everything you need to understand your floor" body="From live camera status to attendance analytics and incident review — in one calm, private workspace." />
        <div className="mt-12"><FeatureGrid items={features} cols={3} /></div>
        <div className="mt-12 flex justify-center"><ButtonLink to="/login" size="lg">Get Started</ButtonLink></div>
      </Section>
    </>
  )
}
