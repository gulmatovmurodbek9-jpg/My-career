import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Токен ихтиёрӣ: агар бошад ва дуруст бошад — req.user; агар набошад — null (на 401).
// Барои амалҳое, ки ҳам меҳмон ва ҳам корбари воридшуда мекунанд (тест, санҷиши касб).
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
    handleRequest(_error: unknown, user: any) {
        return user || null;
    }
}
