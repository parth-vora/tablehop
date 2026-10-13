import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
    turbopack: { root: __dirname },
};

export default withWorkflow(nextConfig);