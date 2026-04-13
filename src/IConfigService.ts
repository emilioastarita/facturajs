import { AgentOptions } from 'https';

export interface IConfigServiceBasics {
    homo: boolean;
    cacheTokensPath: string;
    tokensExpireInHours: number;
    privateKeyContents?: string;
    privateKeyPath?: string;
    certPath?: string;
    certContents?: string;
    useLegacyTls?: boolean;
    tlsRequestOptions?: AgentOptions;
}

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> &
            Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];

export type IConfigService = RequireOnlyOne<
    IConfigServiceBasics,
    'privateKeyContents' | 'privateKeyPath'
> &
    RequireOnlyOne<IConfigServiceBasics, 'certPath' | 'certContents'>;
