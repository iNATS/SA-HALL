import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    foundation: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const liveness = http.get(`${baseUrl}/health/live`, {
    tags: { flow: 'liveness' },
  });
  check(liveness, {
    'liveness returns 200': (response) => response.status === 200,
  });

  const home = http.get(baseUrl, { tags: { flow: 'public-home' } });
  check(home, {
    'home returns 200': (response) => response.status === 200,
    'home is Arabic': (response) => response.body.includes('lang="ar"'),
  });
  sleep(1);
}
