import Sub1 from 'pages/Sample/subpages/Sub1';
import Sub2 from 'pages/Sample/subpages/Sub2';
import Sub2_1 from 'pages/Sample/subpages/Sub2_1';

const routes = [
    {   path: '/sample/sub1',
        component: Sub1
    },
    {   path: '/sample/sub2',
        component: Sub2,
        routes: [
            {   path: '/sample/sub2/sub2_1',
                component: Sub2_1
            }
        ]
    }
];
  
export default routes;