import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../../../shared/presentation/auth-user';
import { ClientIp, CurrentUser, UserAgent } from '../../../shared/presentation/decorators';
import { IssueDownloadLinkUseCase } from '../application/issue-download-link.use-case';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly issueLink: IssueDownloadLinkUseCase) {}

  @Post(':videoId')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  issue(
    @CurrentUser() user: AuthUser,
    @Param('videoId') videoId: string,
    @ClientIp() ip: string,
    @UserAgent() userAgent: string | undefined,
  ) {
    return this.issueLink.execute({ userId: user.id, videoId, ip, userAgent });
  }
}
