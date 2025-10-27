// https://www.acmicpc.net/problem/2389
#include <bits/stdc++.h>
using namespace std;

struct Point {
	double x, y;

	void moveToward(const Point &target, double rate) {
		x += (target.x - x) * rate;
		y += (target.y - y) * rate;
	}
};

double dist2(const Point &a, const Point &b) {
	return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}

Point farthestPoint(const vector<Point> &points, const Point &from) {
	Point res = points[0];
	for (const auto &point : points) {
		if (dist2(from, res) < dist2(from, point)) {
			res = point;
		}
	}
	return res;
}

int main() {
	cin.tie(0) -> sync_with_stdio(0);
	cout << fixed << setprecision(10);

	int n;
	cin >> n;

	vector<Point> points(n);
	for (auto &[x, y] : points) cin >> x >> y;

	Point center{0, 0};
	for (auto [x, y] : points) center.x += x, center.y += y;
	center.x /= n, center.y /= n;

	double rate = 0.1;
	for (int i = 0; i < 50000; i++) {
		Point f = farthestPoint(points, center);
		center.moveToward(f, rate);
		rate *= 0.999;
	}

	Point f = farthestPoint(points, center);
	cout << center.x << " " << center.y << " " << sqrt(dist2(center, f));
	return 0;
}
