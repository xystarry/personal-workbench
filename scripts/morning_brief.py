#!/usr/bin/env python3
"""
盘前分析自动生成脚本
- 抓取持仓个股行情（新浪接口）
- 抓取隔夜美股指数（新浪接口）
- 抓取财经新闻（东方财富 RSS）
- 生成 HTML 报告并输出到 morning-brief/index.html
"""

import json
import os
import re
import urllib.request
import datetime
import sys
from html import escape

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PORTFOLIO_PATH = os.path.join(SCRIPT_DIR, "portfolio.json")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "morning-brief")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://finance.sina.com.cn"
}

# ===== 读取持仓 ======
def load_portfolio():
    with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

# ===== HTTP 请求辅助 ======
def http_get(url, headers=None, timeout=10):
    h = HEADERS.copy()
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()

# ===== 新浪 A 股/ETF 行情 ======
def fetch_sina_stock(code, market):
    """
    market: 'sh' 或 'sz'
    返回新浪行情字符串并解析
    """
    sina_code = f"{market}{code}"
    url = f"https://hq.sinajs.cn/list={sina_code}"
    try:
        data = http_get(url)
        text = data.decode("gbk")
        match = re.search(r'"(.+?)"', text)
        if not match:
            return None
        parts = match.group(1).split(",")
        if len(parts) < 10:
            return None
        name = parts[0]
        open_p = float(parts[1])
        prev_close = float(parts[2])
        price = float(parts[3])
        high = float(parts[4])
        low = float(parts[5])
        volume = float(parts[8])
        amount = float(parts[9])
        change = round(price - prev_close, 3)
        change_pct = round((change / prev_close * 100), 2) if prev_close > 0 else 0
        return {
            "name": name,
            "price": price,
            "prevClose": prev_close,
            "change": change,
            "changePercent": change_pct,
            "open": open_p,
            "high": high,
            "low": low,
            "volume": volume,
            "amount": amount,
        }
    except Exception as e:
        print(f"[WARN] 获取 {code} 行情失败: {e}", file=sys.stderr)
        return None

# ===== 新浪美股指数 ======
def fetch_sina_us_index(code, name_cn):
    """
    code: 'gb_ixic'(纳指), 'gb_dji'(道指), 'gb_inx'(标普500), 'gb_soxx'(费城半导体)
    """
    url = f"https://hq.sinajs.cn/list={code}"
    try:
        data = http_get(url)
        text = data.decode("gbk")
        match = re.search(r'"(.+?)"', text)
        if not match:
            return None
        parts = match.group(1).split(",")
        if len(parts) < 5:
            return None
        name = parts[0] if parts[0] else name_cn
        price = float(parts[1])
        # 新浪美股格式: [0]名称 [1]价格 [2]涨跌幅% [3]时间 [4]涨跌额
        change_pct = float(parts[2]) if parts[2] else 0
        try:
            change = float(parts[4]) if parts[4] else round(price * change_pct / 100, 2)
        except ValueError:
            change = round(price * change_pct / 100, 2)
        return {"name": name_cn, "price": round(price, 2), "change": round(change, 2), "changePercent": round(change_pct, 2)}
    except Exception as e:
        print(f"[WARN] 获取美股指数 {name_cn} 失败: {e}", file=sys.stderr)
        return None

# ===== 抓取财经新闻（东方财富快讯 JSONP）=====
def fetch_finance_news():
    """从东方财富快讯接口获取最新财经新闻"""
    news_list = []
    try:
        url = "https://newsapi.eastmoney.com/kuaixun/v1/getlist_102_ajaxResult_50_1_.html"
        data = http_get(url, headers={"Referer": "https://kuaixun.eastmoney.com/"})
        text = data.decode("utf-8")
        # 东方财富返回格式: var ajaxResult={"rc":1,"LivesList":[...]}
        json_match = re.search(r'var ajaxResult=(\{.*\})', text, re.DOTALL)
        if json_match:
            raw = json_match.group(1)
            data_obj = json.loads(raw)
            items = data_obj.get("LivesList", [])
            if isinstance(items, dict):
                items = items.get("live", [])
            keywords = ["芯片", "半导体", "美股", "存储", "封装", "台积电", "英伟达", "美光",
                        "英特尔", "AI", "算力", "长鑫", "华天", "回购", "上市", "指数", "科技"]
            for item in items:
                title = item.get("title", "")
                content_raw = item.get("digest", item.get("content", ""))
                doc = re.sub(r'<[^>]+>', '', content_raw)[:150]
                if any(k in title or k in doc for k in keywords):
                    news_list.append({
                        "title": title,
                        "content": doc.strip(),
                        "time": item.get("showtime", "")[:5]
                    })
                if len(news_list) >= 8:
                    break
    except Exception as e:
        print(f"[WARN] 获取东方财富新闻失败: {e}", file=sys.stderr)

    return news_list[:8]

# ===== 生成个股点评 ======
def generate_stock_comment(holding, quote, pnl, pnl_pct):
    name = quote["name"]
    change_pct = quote["changePercent"]
    code = holding["code"]
    comments = []
    if "ETF" in name or "516" in code:
        comments.append(f"{name}跟踪中证芯片产业指数，覆盖芯片全产业链。")
    else:
        comments.append(f"{name}（{code}）主营芯片封测，属先进封装概念。")
    if change_pct > 3:
        comments.append(f"昨日大涨{change_pct}%，表现强势。")
    elif change_pct > 0:
        comments.append(f"昨日上涨{change_pct}%，走势偏强。")
    elif change_pct > -3:
        comments.append(f"昨日下跌{abs(change_pct)}%，走势偏弱。")
    else:
        comments.append(f"昨日大跌{abs(change_pct)}%，需警惕。")
    if pnl >= 0:
        comments.append(f"当前浮盈{pnl:,.0f}元（+{pnl_pct}%）。")
    else:
        comments.append(f"当前浮亏{abs(pnl):,.0f}元（{pnl_pct}%）。")
    comments.append("芯片板块近期受国产替代+长鑫科技上市催化，中期逻辑过硬。")
    return " ".join(comments)

# ===== 生成操作建议 ======
def generate_action_advice(holding, quote, pnl, pnl_pct):
    price = quote["price"]
    cost = holding["costPrice"]
    if pnl >= 0:
        return f"当前浮盈，<strong>持有</strong>为主。回调至成本价{cost}附近可加仓；跌破{cost}考虑减仓1/3。上方{round(price*1.05,2)}突破可加仓。"
    else:
        if abs(pnl_pct) < 5:
            return f"小幅浮亏，<strong>逢低加仓</strong>摊低成本。跌至{round(price*0.97,2)}附近可加仓；跌破{round(price*0.95,2)}观望；反弹至成本{cost}以上减仓1/4。"
        elif abs(pnl_pct) < 15:
            return f"浮亏{abs(pnl_pct)}%，<strong>观望</strong>。不急于加仓，等待企稳信号。反弹至{round(price*1.03,2)}以上减仓止损。"
        else:
            return f"浮亏较大，<strong>谨慎</strong>。建议反弹减仓控制风险。"

# ===== 生成大盘判断 ======
def generate_market_judge(us_indices, sox, news):
    us_down = any(idx and idx["change"] < 0 for idx in us_indices)
    sox_down = sox and sox["change"] < 0
    sox_down_big = sox and sox["changePercent"] < -2

    if sox_down_big:
        ext_tag = '<span class="tag tag-yellow">偏空</span>'
        ext_comment = f"隔夜费城半导体指数大跌{abs(sox['changePercent'])}%，美股科技股全面回调，可能拖累A股芯片板块开盘情绪。"
    elif sox_down or us_down:
        ext_tag = '<span class="tag tag-yellow">偏空</span>'
        ext_comment = "隔夜美股科技板块走弱，外围情绪偏空，A股可能小幅低开。"
    else:
        ext_tag = '<span class="tag tag-green">偏多</span>'
        ext_comment = "隔夜美股科技股走强，外围情绪偏多，有利于A股开盘。"

    has_catalyst = any("长鑫" in n["title"] or "回购" in n["title"] or "国产" in n["title"] for n in news)
    a_share_tag = '<span class="tag tag-blue">中性偏多</span>' if has_catalyst else '<span class="tag tag-gray">中性</span>'
    chip_tag = '<span class="tag tag-yellow">多空交织</span>' if sox_down else '<span class="tag tag-red">偏多</span>'

    return f"""
    <div class="data-row"><span class="data-label">外围影响</span>{ext_tag}</div>
    <div class="data-row"><span class="data-label">A股情绪</span>{a_share_tag}</div>
    <div class="data-row"><span class="data-label">芯片板块</span>{chip_tag}</div>
    <p class="analysis-text" style="margin-top:10px;"><strong>外围：</strong>{ext_comment}</p>
    <p class="analysis-text"><strong>A股：</strong>国产替代+长鑫科技上市催化持续，半导体设备销售高景气，多家芯片龙头回购增持。中期上升趋势未改。</p>
    <p class="analysis-text"><strong>大盘判断：</strong>预计今日{'小幅低开' if sox_down else '平开'}, 上证指数在2950-3050点区间震荡。芯片板块分化：设备/先进封装偏强，存储短期{'承压' if sox_down_big else '中性'}。回调即是布局机会。</p>
    """

# ===== 生成核心摘要 ======
def generate_summary(sox, total_pnl, total_pnl_pct, news):
    parts = []
    if sox:
        if sox["changePercent"] < -2:
            parts.append(f"隔夜费城半导体指数大跌{abs(sox['changePercent'])}%")
        elif sox["changePercent"] < 0:
            parts.append(f"隔夜费城半导体指数下跌{abs(sox['changePercent'])}%")
        elif sox["changePercent"] > 0:
            parts.append(f"隔夜费城半导体指数上涨{sox['changePercent']}%")
    for n in news[:3]:
        if "长鑫" in n["title"]:
            parts.append("长鑫科技即将上市催化芯片板块")
            break
        if "回购" in n["title"]:
            parts.append("多家公司回购增持提振信心")
            break
    pnl_sign = "盈" if total_pnl >= 0 else "亏"
    parts.append(f"持仓总{pnl_sign}{abs(total_pnl):,.0f}元({total_pnl_pct:+.1f}%)")
    return "<strong>今日核心：</strong>" + "，".join(parts) + "。"

# ===== 生成 HTML 报告 ======
def generate_html(portfolio, us_indices, sox, stock_quotes, news):
    today = datetime.date.today()
    today_str = today.strftime("%Y年%m月%d日")
    weekday = "周" + "一二三四五六日"[today.weekday()]
    total_value = 0
    total_cost = 0
    holdings_html = ""
    for h in portfolio["holdings"]:
        q = stock_quotes.get(h["code"])
        if not q:
            holdings_html += f'<div class="stock-card"><div class="stock-header"><span class="stock-name">{h["name"]}</span><span class="stock-code">{h["code"]}</span><span class="tag tag-gray">行情获取失败</span></div></div>'
            continue
        shares = h["shares"]
        cost = h["costPrice"]
        price = q["price"]
        mkt_value = round(shares * price, 2)
        cost_value = round(shares * cost, 2)
        pnl = round(mkt_value - cost_value, 2)
        pnl_pct = round((pnl / cost_value) * 100, 2) if cost_value else 0
        total_value += mkt_value
        total_cost += cost_value
        cls = "up" if pnl >= 0 else "down"
        sign = "+" if pnl >= 0 else ""
        day_cls = "up" if q["change"] >= 0 else "down"
        day_sign = "+" if q["change"] >= 0 else ""
        comment = generate_stock_comment(h, q, pnl, pnl_pct)
        action = generate_action_advice(h, q, pnl, pnl_pct)
        holdings_html += f"""
        <div class="stock-card">
          <div class="stock-header">
            <span class="stock-name">{escape(q['name'])}</span>
            <span class="stock-code">{h['code']}</span>
            <span class="tag {'tag-red' if q['change']>=0 else 'tag-green'}">{day_sign}{q['changePercent']}%</span>
          </div>
          <table class="position-table">
            <tr><td class="label">持仓量</td><td class="value">{shares:,} 股</td></tr>
            <tr><td class="label">成本价</td><td class="value">{cost}</td></tr>
            <tr><td class="label">昨收价</td><td class="value">{price}</td></tr>
            <tr><td class="label">浮动盈亏</td><td class="value {cls}">{sign}{pnl:,.0f} 元 ({sign}{pnl_pct}%)</td></tr>
            <tr><td class="label">市值</td><td class="value">{mkt_value:,.0f} 元</td></tr>
          </table>
          <p class="analysis-text">{comment}</p>
          <div class="suggestion"><div class="suggestion-title">操作建议</div>{action}</div>
        </div>"""
    total_pnl = round(total_value - total_cost, 2)
    total_pnl_pct = round((total_pnl / total_cost) * 100, 2) if total_cost else 0
    total_cls = "up" if total_pnl >= 0 else "down"
    total_sign = "+" if total_pnl >= 0 else ""
    us_html = ""
    for idx in us_indices:
        if idx:
            cls = "up" if idx["change"] >= 0 else "down"
            sign = "+" if idx["change"] >= 0 else ""
            us_html += f'<div class="data-row"><span class="data-label">{idx["name"]}</span><span class="data-value {cls}">{sign}{idx["changePercent"]}%</span></div>'
    if sox:
        cls = "up" if sox["change"] >= 0 else "down"
        sign = "+" if sox["change"] >= 0 else ""
        us_html += f'<div class="data-row"><span class="data-label">费城半导体</span><span class="data-value {cls}">{sign}{sox["changePercent"]}%</span></div>'
    news_html = "".join(
        f'<div class="news-item"><div class="news-title">{escape(n["title"])}</div><div class="news-desc">{escape(n["content"])}</div></div>'
        for n in news
    )
    market_judge = generate_market_judge(us_indices, sox, news)
    summary = generate_summary(sox, total_pnl, total_pnl_pct, news)
    now_time = datetime.datetime.now().strftime("%H:%M")
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#F5A88B">
<title>{today_str}盘前分析 | 个人工作台</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;background:#FFF8F5;color:#5C4030;line-height:1.6;padding-bottom:40px}}
.container{{max-width:640px;margin:0 auto;padding:16px}}
.header{{background:linear-gradient(135deg,#F5A88B,#E08868);color:#fff;border-radius:16px;padding:24px 20px;margin-bottom:16px}}
.header h1{{font-size:22px;font-weight:700;margin-bottom:4px}}
.header .date{{font-size:13px;opacity:.8}}
.header .summary{{font-size:14px;margin-top:12px;padding:10px;background:rgba(255,255,255,.15);border-radius:10px}}
.section{{background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 4px 20px rgba(245,168,139,.08)}}
.section h2{{font-size:16px;font-weight:600;color:#C06848;margin-bottom:12px;display:flex;align-items:center;gap:6px}}
.tag{{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:500}}
.tag-red{{background:#FEE2E2;color:#DC2626}}
.tag-green{{background:#D1FAE5;color:#059669}}
.tag-yellow{{background:#FEF3C7;color:#D97706}}
.tag-blue{{background:#DBEAFE;color:#2563EB}}
.tag-gray{{background:#F3F4F6;color:#6B7280}}
.data-row{{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #FFF0E8;font-size:14px}}
.data-row:last-child{{border-bottom:none}}
.data-label{{color:#8B6F5C}}
.data-value{{font-weight:600}}
.up{{color:#DC2626}}.down{{color:#059669}}
.stock-card{{background:#FFF8F5;border-radius:12px;padding:16px;margin-bottom:12px}}
.stock-card:last-child{{margin-bottom:0}}
.stock-header{{display:flex;align-items:center;gap:8px;margin-bottom:10px}}
.stock-name{{font-size:16px;font-weight:700;color:#5C4030}}
.stock-code{{font-size:12px;color:#A09080}}
.position-table{{width:100%;font-size:13px;margin-bottom:10px}}
.position-table td{{padding:4px 0}}
.position-table .label{{color:#8B6F5C;width:40%}}
.position-table .value{{font-weight:600;text-align:right}}
.analysis-text{{font-size:14px;color:#5C4030;line-height:1.7;margin-bottom:10px}}
.suggestion{{background:#FFF0E8;border-left:3px solid #F5A88B;border-radius:8px;padding:12px 16px;font-size:14px;margin-top:8px}}
.suggestion-title{{font-weight:600;color:#C06848;margin-bottom:4px}}
.news-item{{padding:8px 0;border-bottom:1px solid #FFF0E8;font-size:13px}}
.news-item:last-child{{border-bottom:none}}
.news-title{{font-weight:500;color:#5C4030}}
.news-desc{{color:#8B6F5C;font-size:12px;margin-top:2px}}
.disclaimer{{font-size:11px;color:#A09080;text-align:center;margin-top:20px;line-height:1.5}}
.total-bar{{background:linear-gradient(135deg,#FFF0E8,#FFE0D0);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center}}
.total-bar .label{{font-size:13px;color:#8B6F5C}}
.total-bar .value{{font-size:24px;font-weight:700;margin:4px 0}}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📊 盘前分析报告</h1>
    <div class="date">{today_str} {weekday} · 生成于 {now_time}</div>
    <div class="summary">{summary}</div>
  </div>
  <div class="total-bar">
    <div class="label">持仓总市值</div>
    <div class="value">¥ {total_value:,.0f}</div>
    <div class="label">总浮动盈亏 <span class="{total_cls}">{total_sign}{total_pnl:,.0f} 元 ({total_sign}{total_pnl_pct}%)</span></div>
  </div>
  <div class="section">
    <h2>🌍 隔夜美股走势</h2>
    {us_html if us_html else '<p style="font-size:14px;color:#8B6F5C;">数据获取失败</p>'}
  </div>
  <div class="section">
    <h2>📈 大盘走势判断</h2>
    {market_judge}
  </div>
  <div class="section">
    <h2>🔍 持仓个股逐一点评</h2>
    {holdings_html if holdings_html else '<p style="font-size:14px;color:#8B6F5C;">无持仓数据</p>'}
  </div>
  <div class="section">
    <h2>📌 今日重点关注</h2>
    {news_html if news_html else '<p style="font-size:14px;color:#8B6F5C;">暂无新闻数据</p>'}
  </div>
  <div class="disclaimer">
    ⚠️ 以上分析基于公开市场数据和新闻，仅供参考，不构成投资建议。<br>
    投资有风险，入市需谨慎。数据来源：新浪财经、东方财富。
  </div>
</div>
</body>
</html>"""

# ===== 主函数 ======
def main():
    print("[INFO] 开始生成盘前分析...")
    portfolio = load_portfolio()
    # 抓取美股指数
    us_indices = [
        fetch_sina_us_index("gb_ixic", "纳斯达克"),
        fetch_sina_us_index("gb_dji", "道琼斯"),
        fetch_sina_us_index("gb_inx", "标普500"),
    ]
    sox = fetch_sina_us_index("gb_soxx", "费城半导体")
    for idx in us_indices:
        if idx:
            print(f"  [OK] {idx['name']}: {idx['changePercent']:+.2f}%")
    if sox:
        print(f"  [OK] {sox['name']}: {sox['changePercent']:+.2f}%")
    # 抓取持仓行情
    stock_quotes = {}
    for h in portfolio["holdings"]:
        q = fetch_sina_stock(h["code"], h["market"])
        if q:
            stock_quotes[h["code"]] = q
            print(f"  [OK] {h['name']}({h['code']}): {q['price']} ({q['changePercent']:+.2f}%)")
        else:
            print(f"  [FAIL] {h['name']}({h['code']})")
    # 抓取新闻
    news = fetch_finance_news()
    print(f"[INFO] 获取新闻 {len(news)} 条")
    # 生成 HTML
    html_content = generate_html(portfolio, us_indices, sox, stock_quotes, news)
    # 输出
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, "index.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[DONE] 报告已生成: {output_path}")
    # 元数据
    meta = {
        "date": datetime.date.today().strftime("%Y-%m-%d"),
        "generatedAt": datetime.datetime.now().isoformat(),
        "stockCount": len(stock_quotes),
        "newsCount": len(news),
    }
    meta_path = os.path.join(OUTPUT_DIR, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
