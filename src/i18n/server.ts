import {getTranslations as getNextIntlTranslations} from 'next-intl/server';
import {routing} from './routing';

export async function getTranslations(
  namespace: string,
  locale?: string
) {
  return getNextIntlTranslations({namespace, locale: locale ?? routing.defaultLocale});
}
