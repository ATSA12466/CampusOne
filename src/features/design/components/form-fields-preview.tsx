import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";

export function FormFieldsPreview() {
  return (
    <Card padding="lg" className="space-y-5">
      <Field id="design-name" label="Your name" hint="The name your campus friends know.">
        <Input
          id="design-name"
          autoComplete="name"
          placeholder="Ama Nyarko"
          aria-describedby="design-name-hint"
        />
      </Field>
      <Field id="design-programme" label="Programme">
        <Select id="design-programme" defaultValue="it">
          <option value="it">BSc Information Technology</option>
          <option value="cs">BSc Computer Science</option>
          <option value="business">BSc Business Administration</option>
        </Select>
      </Field>
      <Field id="design-bio" label="A little about you">
        <Textarea id="design-bio" placeholder="What are you curious about?" />
      </Field>
      <Field id="design-invalid" label="Error state" error="Please use your student email address.">
        <Input
          id="design-invalid"
          defaultValue="not-an-email"
          aria-invalid="true"
          aria-describedby="design-invalid-error"
        />
      </Field>
      <Field id="design-disabled" label="Disabled state">
        <Input
          id="design-disabled"
          value="Student number supplied by your institution"
          disabled
          readOnly
        />
      </Field>
    </Card>
  );
}
