import { Pipe, PipeTransform } from '@angular/core';
import {
  DateStyle,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatNumber,
  formatSar,
} from '../../core/format/format';

@Pipe({ name: 'sar' })
export class SarPipe implements PipeTransform {
  transform(value: number): string {
    return formatSar(value);
  }
}

@Pipe({ name: 'num' })
export class NumberPipe implements PipeTransform {
  transform(value: number, fractional = false): string {
    return fractional ? formatDecimal(value) : formatNumber(value);
  }
}

@Pipe({ name: 'arDate' })
export class ArDatePipe implements PipeTransform {
  transform(value: string, style: DateStyle = 'long'): string {
    return formatDate(value, style);
  }
}

@Pipe({ name: 'arDateTime' })
export class ArDateTimePipe implements PipeTransform {
  transform(value: string): string {
    return formatDateTime(value);
  }
}
